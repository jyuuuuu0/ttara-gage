import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 구글 로그인 후 돌아오는 주소. code를 세션으로 바꾸고 원래 보던 곳으로 보낸다. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(safeNext)}`, url.origin));
}
