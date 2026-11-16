import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { rowToIdol, type IdolRow, type SpotRow } from "@/lib/store/types";
import { ensureMatched, loadViewer, resolveMerchants } from "@/lib/store/spots";
import { toSpotDTO } from "@/lib/dto";
import { eatplMode } from "@/lib/eatpl/client";
import { unauthorized } from "@/lib/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "아이돌을 찾을 수 없어요." }, { status: 404 });

  const { supabase, user } = await getUser();
  if (!user) return unauthorized();
  const [{ data: idol }, { data: spots }] = await Promise.all([
    supabase.from("idols").select().eq("id", id).maybeSingle(),
    supabase.from("spots").select().eq("idol_id", id).order("created_at"),
  ]);
  if (!idol) return NextResponse.json({ error: "아이돌을 찾을 수 없어요." }, { status: 404 });

  const rows = (spots ?? []) as SpotRow[];
  const [viewer] = await Promise.all([
    loadViewer(supabase, user?.id ?? null, rows.map((s) => s.id)),
    ensureMatched(rows),
  ]);
  const merchants = await resolveMerchants(rows);
  return NextResponse.json({
    idol: rowToIdol(idol as IdolRow),
    spots: rows.map((s) => toSpotDTO(s, viewer, merchants.get(s.id) ?? null)),
    mode: eatplMode(),
    signedIn: !!user,
  });
}
