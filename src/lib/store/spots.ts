import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchMerchants } from "../eatpl/client";
import type { EatplMerchant } from "../eatpl/types";
import { pickBestMatch } from "../match";
import { districtOf } from "../course";
import { adminClient } from "../supabase/admin";
import type { SpotRow, SpotMatch } from "./types";
import type { Viewer } from "../dto";

const keyOf = (m: SpotMatch | null | undefined) =>
  m?.key ?? (m?.merchant ? { merNm: m.merchant.merNm, merAddr: m.merchant.merAddr } : null);

/** 동시에 너무 많이 부르지 않도록 n개씩 처리 (프록시 호출 제한 대비) */
async function mapLimit<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** 아직 매칭 안 한 성지를 잇플 가맹점과 매칭하고, 식별 키만 저장 (관리자 키로 기록) */
export async function ensureMatched(spots: SpotRow[]): Promise<void> {
  const todo = spots.filter((s) => !s.match);
  if (!todo.length) return;
  const admin = adminClient();
  await mapLimit(todo, 4, async (s) => {
    try {
      const candidates = await searchMerchants({ merNm: s.place_name, location: s.location });
      const best = pickBestMatch(s.place_name, s.location, candidates);
      const match: SpotMatch = {
        key: best ? { merNm: best.merchant.merNm, merAddr: best.merchant.merAddr } : null,
        score: best?.score ?? 0,
        matchedAt: new Date().toISOString(),
      };
      const { error } = await admin.from("spots").update({ match }).eq("id", s.id).is("match", null);
      if (error) throw error;
      s.match = match;
    } catch (e) {
      console.error("[match]", s.place_name, e); // 실패하면 다음 요청에서 다시 시도
    }
  });
}

/**
 * 저장된 키로 가맹점 정보를 다시 조회한다 (같은 조건은 6시간 캐시).
 * 주소가 같은 가맹점을 우선 고르고, 없으면 이름이 가장 비슷한 곳을 쓴다.
 */
export async function resolveMerchants(spots: SpotRow[]): Promise<Map<string, EatplMerchant>> {
  const result = new Map<string, EatplMerchant>();
  const targets = spots.map((s) => ({ s, key: keyOf(s.match) })).filter((t) => t.key);
  await mapLimit(targets, 4, async ({ s, key }) => {
    try {
      const items = await searchMerchants({ merNm: key!.merNm, location: districtOf(key!.merAddr) });
      const exact = items.find((m) => m.merAddr === key!.merAddr && m.merNm === key!.merNm)
        ?? items.find((m) => m.merAddr === key!.merAddr)
        ?? pickBestMatch(key!.merNm, districtOf(key!.merAddr), items, 0.8)?.merchant;
      if (exact) result.set(s.id, exact);
    } catch (e) {
      console.error("[resolve]", key!.merNm, e); // 조회 실패 시 그 가게만 정보 없이 보여준다
    }
  });
  return result;
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
