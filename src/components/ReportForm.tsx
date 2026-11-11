"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SOURCE_TYPES } from "@/lib/store/types";
import type { EatplMerchant } from "@/lib/eatpl/types";
import { districtOf } from "@/lib/course";
import IdolPhoto from "./IdolPhoto";

export default function ReportForm({ idolId }: { idolId: string }) {
  const router = useRouter();
  const [idol, setIdol] = useState<{ name: string; imageUrl?: string } | null>(null);
  const [form, setForm] = useState({ placeName: "", location: "", sourceType: "", sourceUrl: "", note: "", publicConfirm: false });
  const [candidates, setCandidates] = useState<EatplMerchant[] | null>(null);
  const [picked, setPicked] = useState<EatplMerchant | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/idols/${idolId}`).then(async (r) => {
      if (!r.ok) return;
      const { idol } = await r.json();
      setIdol({ name: idol.name, imageUrl: idol.imageUrl });
    });
  }, [idolId]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function findMerchant() {
    if (!form.placeName && !form.location) return setError("가게 이름이나 지역을 먼저 적어 주세요.");
    setSearching(true);
    setError("");
    const qs = new URLSearchParams();
    if (form.placeName) qs.set("merNm", form.placeName);
    if (form.location) qs.set("location", form.location);
    const res = await fetch(`/api/merchants?${qs}`);
    const json = await res.json();
    setSearching(false);
    if (!res.ok) return setError(json.error);
    setCandidates(json.merchants);
  }

  function pick(m: EatplMerchant) {
    setPicked(m);
    setForm((f) => ({ ...f, placeName: m.merNm, location: districtOf(m.merAddr) }));
    setCandidates(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idolId, ...form }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(`/idol/${idolId}/report`)}`);
    if (!res.ok) return setError(json.error);
    router.push(`/idol/${idolId}#pending`);
  }

  const input = "h-12 w-full rounded-xl border-2 border-line bg-paper px-4 text-[15px] outline-none transition focus:border-ink";
  const label = "text-sm font-semibold";

  return (
    <div className="grid gap-10 pt-4 lg:grid-cols-[280px_minmax(0,560px)] lg:gap-16">
      <aside className="space-y-5">
        <Link href={`/idol/${idolId}`} className="text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
          {idol ? `${idol.name} 성지로 돌아가기` : "돌아가기"}
        </Link>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">성지 제보</h1>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          방송, 본인 SNS, 인터뷰처럼 누구나 볼 수 있는 출처가 있는 곳만 받아요. 다른 팬 3명이 출처를 확인하면 지도에 올라가요.
        </p>
        {idol && (
          <IdolPhoto src={idol.imageUrl} alt={`${idol.name} 프로필 사진`} className="hidden aspect-[3/4] w-40 rounded-[18px] lg:block" />
        )}
      </aside>

      <form onSubmit={submit} className="space-y-8 rounded-[22px] bg-paper p-6 sm:p-8">
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-extrabold">어느 가게인가요</legend>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <label className="space-y-1.5">
              <span className={label}>가게 이름</span>
              <input className={input} value={form.placeName} onChange={(e) => { set("placeName", e.target.value); setPicked(null); }} />
            </label>
            <label className="space-y-1.5">
              <span className={label}>지역</span>
              <input className={input} placeholder="서울 성동구" value={form.location} onChange={(e) => { set("location", e.target.value); setPicked(null); }} />
            </label>
          </div>

          {picked ? (
            <p className="flex items-center gap-2 rounded-xl bg-sticker/60 px-4 py-3 text-sm">
              <b>{picked.merNm}</b>
              <span className="text-ink-soft">{picked.merAddr}</span>
            </p>
          ) : (
            <button type="button" onClick={findMerchant} disabled={searching}
              className="text-sm font-bold text-cobalt underline decoration-2 underline-offset-4 hover:text-cobalt-deep disabled:opacity-50">
              {searching ? "찾는 중" : "가게 찾아서 영업시간·혼잡도 연결하기"}
            </button>
          )}

          {candidates && (
            <ul className="overflow-hidden rounded-xl border-2 border-ink">
              {candidates.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-soft">
                  찾지 못했어요. 그대로 제보해도 되지만 영업시간과 혼잡도는 보이지 않아요.
                </li>
              )}
              {candidates.map((m) => (
                <li key={m.merNm + m.merAddr} className="border-b border-line last:border-0">
                  <button type="button" onClick={() => pick(m)} className="block w-full px-4 py-3 text-left hover:bg-sticker/40">
                    <span className="font-bold">{m.merNm}</span>
                    <span className="block text-xs text-ink-soft">{m.merTpbuzNm}, {m.merAddr}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-lg font-extrabold">어디서 나왔나요</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="출처 종류">
            {SOURCE_TYPES.map((t) => (
              <button type="button" key={t} role="radio" aria-checked={form.sourceType === t} onClick={() => set("sourceType", t)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
                  form.sourceType === t ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className={label}>출처 링크</span>
            <input className={input} type="url" placeholder="https://" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>
              어떤 장면이었나요 <span className="font-normal text-ink-soft">선택</span>
            </span>
            <textarea className={`${input} h-24 resize-none py-3`} maxLength={300}
              placeholder="12분 30초쯤 메뉴를 추천해요" value={form.note} onChange={(e) => set("note", e.target.value)} />
          </label>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sleeve p-4">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-cobalt" checked={form.publicConfirm}
            onChange={(e) => set("publicConfirm", e.target.checked)} />
          <span className="text-[15px]">
            공개된 콘텐츠에서 직접 확인한 곳이에요
            <span className="mt-1 block text-sm text-ink-soft">
              목격담이나 숙소, 집 근처처럼 사적인 장소는 아티스트의 안전을 위해 받지 않아요.
            </span>
          </span>
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button type="submit" disabled={submitting}
          className="h-13 w-full rounded-full bg-cobalt py-3.5 text-base font-bold text-white transition hover:bg-cobalt-deep disabled:opacity-50">
          {submitting ? "보내는 중" : "제보 보내기"}
        </button>
      </form>
    </div>
  );
}
