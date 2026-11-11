import LoginButton from "@/components/LoginButton";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div className="mx-auto max-w-md pt-10 lg:pt-20">
      <h1 className="font-display text-5xl leading-tight">로그인</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
        아이돌 목록은 누구나 볼 수 있어요. 성지 지도와 순례 코스를 보고, 제보하고, 다른 팬의 제보를 확인하려면 로그인해 주세요.
      </p>
      {error && <p className="mt-4 text-sm font-medium text-red-600">로그인하지 못했어요. 다시 시도해 주세요.</p>}
      <div className="mt-8">
        <LoginButton next={safeNext} />
      </div>
      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        구글 계정의 이름과 이메일은 로그인 확인에만 쓰이고, 다른 사람에게 보이지 않아요.
      </p>
    </div>
  );
}
