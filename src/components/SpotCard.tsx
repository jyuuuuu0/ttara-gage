"use client";

import type { SpotDTO } from "@/lib/dto";
import { formatHHMM, isPeakNow, openState, type KstNow } from "@/lib/hours";
import { formatRank } from "@/lib/format";
import { dayChar, yes } from "@/lib/eatpl/types";
import { Chip, OpenSticker, PeakSticker } from "./Badges";

export default function SpotCard({
  spot, now, selected, onSelect, onVerify, onFlag, threshold,
}: {
  spot: SpotDTO;
  now: KstNow;
  selected?: boolean;
  onSelect?: () => void;
  onVerify?: () => void;
  onFlag?: () => void;
  threshold: number;
}) {
  const m = spot.merchant;
  const visitors = m?.vistCstmrRnkList ? [m.vistCstmrRnkList.rk01, m.vistCstmrRnkList.rk02, m.vistCstmrRnkList.rk03].filter(Boolean) : [];
  const peak = m ? isPeakNow(m, now) : false;

  return (
    <article
      id={`spot-${spot.id}`}
      onClick={onSelect}
      className={`relative cursor-pointer rounded-[18px] border-2 bg-paper p-5 transition ${
        selected ? "border-ink shadow-[5px_5px_0_var(--color-ink)]" : "border-transparent hover:border-line"
      }`}
    >
      {m && (
        <div className="absolute -top-2.5 right-4 flex gap-1.5">
          {peak && <PeakSticker />}
          <OpenSticker state={openState(m, now)} />
        </div>
      )}

      <header>
        <h3 className="pr-24 text-lg font-extrabold leading-snug">{m?.merNm ?? spot.placeName}</h3>
        <p className="mt-1 text-[13px] text-ink-soft">{m ? m.merAddr : spot.location}</p>
      </header>

      {spot.note && <p className="mt-3 border-l-[3px] border-pink pl-3 text-[15px] leading-relaxed">{spot.note}</p>}

      {m ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-soft">영업시간</dt>
              <dd className="font-semibold tabular-nums">{formatHHMM(m.srtTime)}–{formatHHMM(m.endTime)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">쉬는 날</dt>
              <dd className="font-semibold">{m.hldyDwk?.length ? `${m.hldyDwk.map(dayChar).join(", ")}요일` : "없음"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">제일 붐비는 때</dt>
              <dd className="font-semibold">{m.congestionDwk ? `${dayChar(m.congestionDwk)}요일 ${m.congestionTizn ?? ""}` : "정보 없음"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">동네 {m.merTpbuzNm} 중</dt>
              <dd className="font-semibold">매출 {formatRank(m.ccgSaleRnk)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Chip strong>{m.merTpbuzNm}</Chip>
            {yes(m.loclPrsnPpltYn) && <Chip>동네 사람들이 많이 가요</Chip>}
            {yes(m.frnrVsitYn) && <Chip>외국인 손님도 와요</Chip>}
            {yes(m.empyVsitYn) && <Chip>여럿이 가기 좋아요</Chip>}
            {visitors.length > 0 && <Chip>주 손님 {visitors.join(", ")}</Chip>}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">이 가게는 영업시간과 혼잡도 정보가 아직 없어요.</p>
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <a
          href={spot.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-bold text-cobalt underline decoration-2 underline-offset-4 hover:text-cobalt-deep"
        >
          {spot.sourceType} 출처 보기
        </a>
        {m?.merUrl && (
          <a
            href={m.merUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          >
            지금 영업하는지 확인
          </a>
        )}
        {onFlag && !spot.mine && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlag(); }}
            disabled={spot.iFlagged}
            className="ml-auto text-xs text-ink-soft hover:text-red-600 disabled:opacity-50"
          >
            {spot.iFlagged ? "신고했어요" : "신고"}
          </button>
        )}
      </footer>

      {spot.status === "pending" && onVerify && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-sleeve p-3">
          <div className="flex gap-1" aria-label={`확인 ${spot.verifyCount}/${threshold}`}>
            {Array.from({ length: threshold }).map((_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < spot.verifyCount ? "bg-cobalt" : "bg-line"}`} />
            ))}
          </div>
          <p className="flex-1 text-xs text-ink-soft">
            {spot.mine ? "직접 올린 제보는 다른 팬이 확인해 줘야 해요" : `${threshold}명이 확인하면 공개돼요`}
          </p>
          {!spot.mine && (
            <button
              onClick={(e) => { e.stopPropagation(); onVerify(); }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                spot.iVerified ? "bg-ink text-white" : "bg-cobalt text-white hover:bg-cobalt-deep"
              }`}
            >
              {spot.iVerified ? "확인 취소" : "출처 확인했어요"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
