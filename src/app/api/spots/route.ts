import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { validateSpotInput } from "@/lib/store/validate";
import { dbErrorMessage, ensureMatched, loadViewer } from "@/lib/store/spots";
import { toSpotDTO } from "@/lib/dto";
import { unauthorized } from "@/lib/http";
import type { SpotRow } from "@/lib/store/types";

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return unauthorized();

  const parsed = validateSpotInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;

  const { data, error } = await supabase
    .from("spots")
    .insert({
      idol_id: v.idolId,
      place_name: v.placeName,
      location: v.location,
      source_url: v.sourceUrl,
      source_type: v.sourceType,
      note: v.note,
      reporter_id: user.id,
    })
    .select()
    .single();

  if (error) {
    const e = dbErrorMessage(error);
    const message = error.code === "23505" ? "이미 제보된 가게예요. 확인 기다리는 제보에서 출처 확인에 참여해 주세요." : e.message;
    return NextResponse.json({ error: message }, { status: e.status });
  }
  const spot = data as SpotRow;
  await ensureMatched([spot]);
  return NextResponse.json({ spot: toSpotDTO(spot, await loadViewer(supabase, user.id, [])) }, { status: 201 });
}
