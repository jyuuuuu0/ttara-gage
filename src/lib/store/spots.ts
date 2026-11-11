import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchMerchants } from "../eatpl/client";
import { pickBestMatch } from "../match";
import { adminClient } from "../supabase/admin";
import type { SpotRow, SpotMatch } from "./types";
import type { Viewer } from "../dto";

/** 아직 매칭 안 한 성지를 가게 정보와 매칭하고 저장 (관리자 키로 기록) */
export async function ensureMatched(spots: SpotRow[]): Promise<void> {
  const todo = spots.filter((s) => !s.match);
  if (!todo.length) return;
  const admin = adminClient();
  await Promise.all(
    todo.map(async (s) => {
      try {
        const candidates = await searchMerchants({ merNm: s.place_name, location: s.location });
        const best = pickBestMatch(s.place_name, s.location, candidates);
        const match: SpotMatch = { merchant: best?.merchant ?? null, score: best?.score ?? 0, matchedAt: new Date().toISOString() };
        const { error } = await admin.from("spots").update({ match }).eq("id", s.id).is("match", null);
        if (error) throw error;
        s.match = match;
      } catch (e) {
        console.error("[match]", s.place_name, e); // 실패하면 다음 요청에서 다시 시도
      }
    }),
  );
}

/** 로그인한 사용자가 어떤 성지를 확인/신고했는지 */
export async function loadViewer(supabase: SupabaseClient, userId: string | null, spotIds: string[]): Promise<Viewer> {
  const v: Viewer = { userId, verified: new Set(), flagged: new Set() };
  if (!userId || !spotIds.length) return v;
  const [ver, fl] = await Promise.all([
    supabase.from("spot_verifications").select("spot_id").in("spot_id", spotIds),
    supabase.from("spot_flags").select("spot_id").in("spot_id", spotIds),
  ]);
  ver.data?.forEach((r) => v.verified.add(r.spot_id));
  fl.data?.forEach((r) => v.flagged.add(r.spot_id));
  return v;
}

/** Postgres/RLS 오류를 사용자에게 보여줄 문장으로 */
export function dbErrorMessage(e: { code?: string; message?: string } | null): { message: string; status: number } {
  if (!e) return { message: "알 수 없는 오류예요.", status: 500 };
  if (e.code === "23505") return { message: "이미 등록되어 있어요.", status: 409 };
  if (e.code === "42501") return { message: "이 작업을 할 수 없어요.", status: 403 };
  if (e.code === "23514") return { message: "입력값을 다시 확인해 주세요.", status: 400 };
  if (e.message?.includes("rate_limited")) return { message: "제보가 너무 많아요. 한 시간 뒤에 다시 시도해 주세요.", status: 429 };
  return { message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.", status: 500 };
}
