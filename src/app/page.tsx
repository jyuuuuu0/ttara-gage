"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { affiliation } from "@/lib/idol";
import IdolPhoto from "@/components/IdolPhoto";

interface IdolItem { id: string; name: string; group?: string; solo?: boolean; agency?: string; imageUrl?: string; spotCount: number }

export default function Home() {
  const [q, setQ] = useState("");
  const [idols, setIdols] = useState<IdolItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/idols?q=${encodeURIComponent(q)}`);
      setIdols((await res.json()).idols);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const query = q.trim();
  const noResult = idols?.length === 0 && query.length > 0;

  return (
    <div className="space-y-10 pt-6 lg:pt-14">
      <section className="max-w-3xl">
        <h1 className="font-display text-[44px] leading-[1.08] sm:text-7xl lg:text-[88px]">
          최애가 간 가게,
          <br />
          나도 따라가게
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
          방송이나 SNS에 나온 가게를 팬들이 출처와 함께 모았어요. 지금 문을 열었는지, 붐비는 시간인지도 같이 보여드려요.
        </p>
      </section>

      <label className="block max-w-3xl">
        <span className="sr-only">아이돌 검색</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setShowForm(false); }}
          placeholder="아이돌, 그룹, 소속사 이름"
          className="h-16 w-full rounded-full border-[2.5px] border-ink bg-paper px-7 text-lg font-semibold shadow-[5px_5px_0_var(--color-ink)] outline-none focus-visible:outline-none transition placeholder:font-normal placeholder:text-ink-soft/60 focus:shadow-[2px_2px_0_var(--color-ink)] focus:translate-x-[3px] focus:translate-y-[3px]"
        />
      </label>

      <section>
        {idols === null && <p className="text-sm text-ink-soft">불러오는 중</p>}

        {idols && idols.length > 0 && (
          <ul className="max-w-3xl border-t-2 border-ink">
            {idols.map((i) => (
              <li key={i.id} className="border-b-2 border-line">
                <Link
                  href={`/idol/${i.id}`}
                  className="flex items-center gap-4 px-1 py-5 transition hover:bg-paper sm:gap-6 sm:px-4"
                >
                  <IdolPhoto src={i.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-full sm:h-16 sm:w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-3xl leading-tight sm:text-4xl">{i.name}</p>
                    <p className="mt-1 truncate text-sm text-ink-soft">{affiliation(i) || "소속 정보 없음"}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-bold">
                    {i.spotCount > 0 ? `성지 ${i.spotCount}곳` : <span className="font-medium text-ink-soft">성지 없음</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query && (noResult || showForm) ? (
          <div className="mt-8">
            <RegisterForm initialName={query} isNew={noResult} />
          </div>
        ) : (
          query && idols && idols.length > 0 && (
            <button onClick={() => setShowForm(true)} className="mt-8 text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
              찾는 사람이 없으면 직접 등록할 수 있어요
            </button>
          )
        )}
      </section>
    </div>
  );
}

function RegisterForm({ initialName, isNew }: { initialName: string; isNew: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState("");
  const [solo, setSolo] = useState(false);
  const [agency, setAgency] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setName(initialName), [initialName]);
  const valid = name.trim().length > 0 && (solo || group.trim().length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/idols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, group, solo, agency, imageUrl }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.status === 401) return router.push("/login?next=/");
    if (!res.ok) return setError(json.error);
    router.push(`/idol/${json.idol.id}`);
  }

  const input =
    "h-12 w-full rounded-xl border-2 border-line bg-paper px-4 text-[15px] outline-none transition focus:border-ink disabled:bg-sleeve disabled:text-ink-soft";

  return (
    <form onSubmit={submit} className="max-w-3xl rounded-[20px] bg-paper p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-extrabold">{isNew ? `‘${initialName}’ 카드 만들기` : "새 카드 만들기"}</h2>
          <p className="mt-1 text-sm text-ink-soft">이름이 같은 아이돌이 있을 수 있어서 소속 그룹이 꼭 필요해요.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">이름</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">소속 그룹</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" className="h-4 w-4 accent-cobalt" checked={solo} onChange={(e) => setSolo(e.target.checked)} />
              솔로예요
            </label>
          </div>
          <input
            className={input}
            value={solo ? "" : group}
            disabled={solo}
            onChange={(e) => setGroup(e.target.value)}
            placeholder={solo ? "솔로 아티스트" : "예: TOMORROW X TOGETHER"}
          />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">
            소속사 <span className="font-normal text-ink-soft">선택</span>
          </span>
          <input className={input} value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="예: 빅히트 뮤직" />
        </label>

        <div className="space-y-1.5">
          <label htmlFor="imageUrl" className="text-sm font-semibold">
            프로필 사진 주소 <span className="font-normal text-ink-soft">선택</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="imageUrl"
              type="url"
              className={input}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://"
            />
            <IdolPhoto key={imageUrl} src={imageUrl.startsWith("https://") ? imageUrl : undefined} alt="미리보기" className="h-12 w-12 shrink-0 rounded-full" />
          </div>
          <p className="text-xs text-ink-soft">비워 두면 사진 없이 보여요.</p>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!valid || busy}
          className="h-12 w-full rounded-full bg-cobalt text-[15px] font-bold text-white transition hover:bg-cobalt-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
        >
          {busy ? "만드는 중" : "카드 만들고 성지 보러 가기"}
        </button>
      </div>
    </form>
  );
}
