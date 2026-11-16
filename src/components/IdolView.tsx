"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SpotDTO } from "@/lib/dto";
import type { Idol } from "@/lib/store/types";
import { VERIFY_THRESHOLD } from "@/lib/store/types";
import { isPeakNow, kstNow, openState } from "@/lib/hours";
import { buildCourses, districtOf } from "@/lib/course";
import { affiliationParts } from "@/lib/idol";
import SpotCard from "./SpotCard";
import CourseList from "./CourseList";
import IdolPhoto from "./IdolPhoto";

const SpotMap = dynamic(() => import("./SpotMap"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-[22px] bg-line/60 lg:h-[calc(100dvh-6rem)]" />,
});

type Tab = "spots" | "courses" | "pending";

export default function IdolView({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<{ idol: Idol; spots: SpotDTO[]; mode: string; signedIn: boolean } | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("spots");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [avoidPeak, setAvoidPeak] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [now, setNow] = useState(() => kstNow());
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/idols/${id}`, { cache: "no-store" });
    const json = await res.json();
    if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(`/idol/${id}`)}`);
    if (!res.ok) return setError(json.error);
    setData(json);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (window.location.hash === "#pending") setTab("pending");
    const t = setInterval(() => setNow(kstNow()), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const verified = useMemo(() => data?.spots.filter((s) => s.status === "verified") ?? [], [data]);
  const pending = useMemo(() => data?.spots.filter((s) => s.status === "pending") ?? [], [data]);
  const categories = useMemo(
    () => [...new Set(verified.map((s) => s.merchant?.merTpbuzNm).filter(Boolean) as string[])],
    [verified],
  );

  const filtered = useMemo(
    () =>
      verified.filter((s) => {
        const m = s.merchant;
        if (category && m?.merTpbuzNm !== category) return false;
        if (openOnly && (!m || openState(m, now) !== "open")) return false;
        if (avoidPeak && m && isPeakNow(m, now)) return false;
        return true;
      }),
    [verified, category, openOnly, avoidPeak, now],
  );

  const courses = useMemo(
    () =>
      buildCourses(
        verified
          .filter((s) => s.latLng && s.merchant)
          .map((s) => ({ id: s.id, name: s.merchant!.merNm, district: districtOf(s.merchant!.merAddr), latLng: s.latLng! })),
      ),
    [verified],
  );

  const openCount = verified.filter((s) => s.merchant && openState(s.merchant, now) === "open").length;

  function select(spotId: string) {
    setSelectedId(spotId);
    document.getElementById(`spot-${spotId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function act(spotId: string, action: "verify" | "flag") {
    const res = await fetch(`/api/spots/${spotId}/${action}`, { method: "POST" });
    const json = await res.json();
    if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(`/idol/${id}#pending`)}`);
    if (!res.ok) return setToast(json.error);
    if (action === "verify") setToast(json.spot?.status === "verified" ? "확인이 모여서 성지로 공개됐어요" : json.spot?.iVerified ? "확인했어요" : "확인을 취소했어요");
    if (action === "flag") setToast(json.hidden ? "신고가 쌓여서 숨겼어요" : "신고했어요");
    load();
  }

  if (error)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">{error}</p>
        <Link href="/" className="mt-3 inline-block text-cobalt underline underline-offset-4">다른 아이돌 찾기</Link>
      </div>
    );
  if (!data) return <div className="mt-6 h-64 animate-pulse rounded-[22px] bg-line/60" />;

  const { group, agency } = affiliationParts(data.idol);
  const points = filtered
    .filter((s) => s.latLng)
    .map((s) => ({
      id: s.id,
      latLng: s.latLng!,
      label: s.merchant?.merNm ?? s.placeName,
      dim: s.merchant ? openState(s.merchant, now) !== "open" : true,
    }));

  const tabs: [Tab, string, number][] = [
    ["spots", "성지", verified.length],
    ["courses", "순례 코스", courses.length],
    ["pending", "확인 기다리는 제보", pending.length],
  ];

  return (
    <div className="space-y-8 pt-4">
      {/* 히어로: (사진) + 이름 */}
      <section className="flex items-end gap-5 sm:gap-8">
        <IdolPhoto
          src={data.idol.imageUrl}
          alt={`${data.idol.name} 프로필 사진`}
          className="aspect-[3/4] w-[112px] shrink-0 rounded-[18px] sm:w-[170px]"
        />
        <div className="min-w-0 pb-1">
          <p className="text-sm text-ink-soft">
            {group && <span className="font-semibold text-ink">{group}</span>}
            {group && agency && <span className="mx-2 text-line">/</span>}
            {agency}
          </p>
          <h1 className="font-display mt-1 break-keep text-[40px] leading-[1.05] sm:text-6xl lg:text-7xl">{data.idol.name}</h1>
          <p className="mt-3 text-[15px] text-ink-soft">
            {verified.length > 0 ? (
              <>
                성지 <b className="text-ink">{verified.length}곳</b>, 그중 <b className="text-ink">{openCount}곳</b>이 지금 문을 열었어요
              </>
            ) : (
              "아직 확인된 성지가 없어요"
            )}
          </p>
          <Link
            href={`/idol/${id}/report`}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-cobalt px-5 text-sm font-bold text-white transition hover:bg-cobalt-deep"
          >
            성지 제보하기
          </Link>
        </div>
      </section>

      {data.mode === "mock" ? (
        <p className="text-xs text-ink-soft">지금은 예시 가게 데이터로 보여주고 있어요.</p>
      ) : (
        <p className="text-xs text-ink-soft">
          가게 정보: eat.pl 잇플 · BC카드 결제 데이터 기반. 영업시간은 최근 1개월 결제 시각으로 추정한 값이에요.
        </p>
      )}

      <nav className="-mx-4 flex gap-6 overflow-x-auto border-b-2 border-line px-4 lg:mx-0 lg:px-0" role="tablist">
        {tabs.map(([k, label, n]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-[2px] shrink-0 border-b-[3px] pb-3 text-[15px] font-bold transition ${
              tab === k ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {label} <span className="tabular-nums text-ink-soft">{n}</span>
          </button>
        ))}
      </nav>

      {tab === "spots" && (
        <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
          <div className="lg:sticky lg:top-6">
            {points.length > 0 ? (
              <SpotMap
                points={points}
                selectedId={selectedId}
                onSelect={select}
                className="h-[340px] sm:h-[420px] lg:h-[calc(100dvh-6rem)]"
              />
            ) : (
              <div className="hidden h-[calc(100dvh-6rem)] items-center justify-center rounded-[22px] border-2 border-dashed border-line text-sm text-ink-soft lg:flex">
                조건에 맞는 성지가 지도에 없어요
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Filter on={openOnly} onClick={() => setOpenOnly((v) => !v)}>지금 영업 중</Filter>
              <Filter on={avoidPeak} onClick={() => setAvoidPeak((v) => !v)}>붐비는 곳 빼기</Filter>
              {categories.map((c) => (
                <Filter key={c} on={category === c} onClick={() => setCategory((v) => (v === c ? null : c))}>
                  {c}
                </Filter>
              ))}
            </div>

            <div className="space-y-4 pt-1">
              {filtered.map((s) => (
                <SpotCard
                  key={s.id}
                  spot={s}
                  now={now}
                  threshold={VERIFY_THRESHOLD}
                  selected={s.id === selectedId}
                  onSelect={() => setSelectedId(s.id)}
                  onFlag={() => act(s.id, "flag")}
                />
              ))}
              {filtered.length === 0 && (
                <Empty>
                  {verified.length === 0 ? (
                    <>
                      아직 확인된 성지가 없어요.{" "}
                      <Link href={`/idol/${id}/report`} className="font-bold text-cobalt underline underline-offset-4">첫 제보 남기기</Link>
                    </>
                  ) : (
                    "조건에 맞는 성지가 없어요. 필터를 줄여 보세요."
                  )}
                </Empty>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "courses" && <CourseList courses={courses} spots={verified} now={now} />}

      {tab === "pending" && (
        <div className="space-y-5">
          <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">
            다른 팬이 올린 제보예요. 출처 링크를 직접 열어 보고 맞으면 눌러 주세요. {VERIFY_THRESHOLD}명이 확인하면 성지로 공개돼요.
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((s) => (
              <SpotCard
                key={s.id}
                spot={s}
                now={now}
                threshold={VERIFY_THRESHOLD}
                onVerify={() => act(s.id, "verify")}
                onFlag={() => act(s.id, "flag")}
              />
            ))}
          </div>
          {pending.length === 0 && <Empty>확인을 기다리는 제보가 없어요.</Empty>}
        </div>
      )}

      <div aria-live="polite">
        {toast && (
          <div className="fixed inset-x-0 bottom-6 z-[1100] mx-auto w-fit rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgb(26_27_46/.6)]">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
        on ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[18px] border-2 border-dashed border-line px-6 py-14 text-center text-[15px] text-ink-soft">{children}</p>;
}
