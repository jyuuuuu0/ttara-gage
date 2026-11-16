import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { dbErrorMessage, loadViewer, resolveMerchants } from "@/lib/store/spots";
import { toSpotDTO } from "@/lib/dto";
import { unauthorized } from "@/lib/http";
import type { SpotRow } from "@/lib/store/types";

/** 출처 확인 토글. 본인 제보·이미 공개된 성지는 RLS가 막는다. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getUser();
  if (!user) return unauthorized();

  const { data: mine } = await supabase.from("spot_verifications").select("spot_id").eq("spot_id", id).maybeSingle();
  const { error } = mine
    ? await supabase.from("spot_verifications").delete().eq("spot_id", id).eq("user_id", user.id)
    : await supabase.from("spot_verifications").insert({ spot_id: id, user_id: user.id });

  if (error) {
    const e = dbErrorMessage(error);
    const message = error.code === "42501" ? "직접 올린 제보나 이미 공개된 성지는 확인할 수 없어요." : e.message;
    return NextResponse.json({ error: message }, { status: e.status });
  }

  const { data: spot } = await supabase.from("spots").select().eq("id", id).maybeSingle();
  if (!spot) return NextResponse.json({ error: "성지를 찾을 수 없어요." }, { status: 404 });
  const [viewer, merchants] = await Promise.all([loadViewer(supabase, user.id, [id]), resolveMerchants([spot as SpotRow])]);
  return NextResponse.json({ spot: toSpotDTO(spot as SpotRow, viewer, merchants.get(id) ?? null) });
}
