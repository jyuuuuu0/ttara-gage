import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { rowToIdol, type IdolRow } from "@/lib/store/types";
import { dbErrorMessage } from "@/lib/store/spots";
import { unauthorized } from "@/lib/http";

const clean = (s: string) => s.replace(/[%,()*\\]/g, "").trim();

export async function GET(req: Request) {
  const q = clean(new URL(req.url).searchParams.get("q") ?? "");
  const supabase = await createClient();
  let query = supabase
    .from("idols")
    .select("*, spots(count)")
    .eq("spots.status", "verified")
    .order("created_at", { ascending: true })
    .limit(50);
  if (q) query = query.or(`name.ilike.%${q}%,group_name.ilike.%${q}%,agency.ilike.%${q}%,aliases.cs.{${q}}`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: dbErrorMessage(error).message }, { status: 500 });

  const idols = (data as (IdolRow & { spots: { count: number }[] })[])
    .map((r) => ({ ...rowToIdol(r), spotCount: r.spots?.[0]?.count ?? 0 }))
    .sort((a, b) => b.spotCount - a.spotCount);
  return NextResponse.json({ idols });
}

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { name?: string; group?: string; solo?: boolean; agency?: string; imageUrl?: string };
  const name = (body.name ?? "").trim();
  const solo = body.solo === true;
  const group = solo ? "" : (body.group ?? "").trim();
  const agency = (body.agency ?? "").trim();
  const imageUrl = (body.imageUrl ?? "").trim();

  if (name.length < 1 || name.length > 30) return NextResponse.json({ error: "이름을 1~30자로 입력해 주세요." }, { status: 400 });
  if (!solo && !group) return NextResponse.json({ error: "어느 그룹 소속인지 입력해 주세요. 솔로라면 ‘솔로’를 체크해 주세요." }, { status: 400 });
  if (group.length > 40 || agency.length > 40) return NextResponse.json({ error: "그룹과 소속사는 40자 이내로 입력해 주세요." }, { status: 400 });
  if (imageUrl && !imageUrl.startsWith("https://")) return NextResponse.json({ error: "사진 주소는 https:// 로 시작해야 해요." }, { status: 400 });

  const { data, error } = await supabase
    .from("idols")
    .insert({ name, group_name: group || null, solo, agency: agency || null, image_url: imageUrl || null, created_by: user.id })
    .select()
    .single();

  if (error?.code === "23505") {
    // 이미 있는 아이돌이면 그쪽으로 보낸다
    let q = supabase.from("idols").select().ilike("name", name.replace(/\s+/g, "%")).eq("solo", solo);
    q = solo ? q.is("group_name", null) : q.ilike("group_name", group);
    const { data: exist } = await q.limit(1).maybeSingle();
    if (exist) return NextResponse.json({ idol: rowToIdol(exist as IdolRow) });
  }
  if (error) {
    const e = dbErrorMessage(error);
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  return NextResponse.json({ idol: rowToIdol(data as IdolRow) }, { status: 201 });
}
