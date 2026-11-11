import type { Metadata } from "next";
import Link from "next/link";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/gasoek-one";
import "./globals.css";
import { BRAND, TAGLINE } from "@/lib/format";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${BRAND} — ${TAGLINE}`,
  description: "방송, SNS, 인터뷰로 확인된 최애의 가게를 지도와 코스로 모아 보세요.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getUser();
  const displayName = (user?.user_metadata?.name as string | undefined) ?? user?.email?.split("@")[0];

  return (
    <html lang="ko">
      <body className="min-h-dvh font-sans antialiased">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="font-display text-2xl text-ink">
            {BRAND}
          </Link>
          {user ? (
            <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm">
              <span className="hidden max-w-40 truncate text-ink-soft sm:inline">{displayName}</span>
              <button className="font-semibold underline decoration-line underline-offset-4 hover:decoration-ink">로그아웃</button>
            </form>
          ) : (
            <Link href="/login" className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold hover:bg-sticker">
              로그인
            </Link>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-ink-soft lg:px-8">
          {BRAND}는 공개된 방송, SNS, 인터뷰에서 확인된 장소만 다뤄요.
        </footer>
      </body>
    </html>
  );
}
