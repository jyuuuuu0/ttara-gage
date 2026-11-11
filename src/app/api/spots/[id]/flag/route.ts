import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { dbErrorMessage } from "@/lib/store/spots";
import { unauthorized } from "@/lib/http";

/** 사생활 침해·허위 제보 신고. 신고가 쌓이면 DB 트리거가 숨긴다. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getUser();
  if (!user) return unauthorized();

  const { error } = await supabase.from("spot_flags").insert({ spot_id: id, user_id: user.id });
  if (error && error.code !== "23505") {
    const e = dbErrorMessage(error);
    const message = error.code === "42501" ? "직접 올린 제보는 신고할 수 없어요." : e.message;
    return NextResponse.json({ error: message }, { status: e.status });
  }
  // 숨김 처리되면 RLS 때문에 더 이상 보이지 않는다
  const { data } = await supabase.from("spots").select("id").eq("id", id).maybeSingle();
  return NextResponse.json({ hidden: !data });
}
