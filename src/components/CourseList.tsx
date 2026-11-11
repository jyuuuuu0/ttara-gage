"use client";

import dynamic from "next/dynamic";
import { Fragment } from "react";
import type { Course } from "@/lib/course";
import type { SpotDTO } from "@/lib/dto";
import { distanceM } from "@/lib/geo";
import { formatHHMM, isPeakNow, openState, type KstNow } from "@/lib/hours";
import { OpenSticker, PeakSticker } from "./Badges";

const SpotMap = dynamic(() => import("./SpotMap"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-[22px] bg-line/60" />,
});

const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);
const walkMin = (m: number) => Math.max(1, Math.round(m / 67)); // 도보 분속 약 67m

export default function CourseList({ courses, spots, now }: { courses: Course[]; spots: SpotDTO[]; now: KstNow }) {
  if (!courses.length) {
    return (
      <p className="rounded-[18px] border-2 border-dashed border-line px-6 py-14 text-center text-[15px] text-ink-soft">
        같은 동네에 성지가 두 곳 이상 모이면 걸어서 도는 코스를 만들어 드려요.
      </p>
    );
  }
  const byId = new Map(spots.map((s) => [s.id, s]));

  return (
    <div className="space-y-12">
      {courses.map((c) => {
        const area = c.district.split(" ").at(-1);
        return (
          <section key={c.district} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
            <SpotMap
              path
              className="h-[280px] lg:h-[400px]"
              points={c.stops.map((s, i) => ({ id: s.id, latLng: s.latLng, label: s.name, order: i + 1 }))}
            />
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">{area} 한 바퀴</h2>
              <p className="mt-2 text-[15px] text-ink-soft">
                {c.stops.length}곳을 걸어서 약 {walkMin(c.totalM)}분, 총 {fmtDist(c.totalM)}
              </p>

              <ol className="mt-6">
                {c.stops.map((s, i) => {
                  const m = byId.get(s.id)?.merchant;
                  const next = c.stops[i + 1];
                  const leg = next ? distanceM(s.latLng, next.latLng) : 0;
                  return (
                    <Fragment key={s.id}>
                      <li className="grid grid-cols-[36px_1fr] gap-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">
                          {i + 1}
                        </span>
                        <div className="rounded-[16px] bg-paper px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold">{s.name}</p>
                            {m && <OpenSticker state={openState(m, now)} />}
                            {m && isPeakNow(m, now) && <PeakSticker />}
                          </div>
                          {m && (
                            <p className="mt-0.5 text-sm text-ink-soft">
                              {m.merTpbuzNm}, {formatHHMM(m.srtTime)}–{formatHHMM(m.endTime)}
                            </p>
                          )}
                        </div>
                      </li>
                      {next && (
                        <li aria-hidden className="grid grid-cols-[36px_1fr] gap-4">
                          <span className="mx-auto h-full min-h-10 w-[3px] rounded bg-[repeating-linear-gradient(to_bottom,var(--color-pink)_0_6px,transparent_6px_12px)]" />
                          <span className="py-3 text-sm text-ink-soft">
                            걸어서 {walkMin(leg)}분 <span className="text-line">/</span> {fmtDist(leg)}
                          </span>
                        </li>
                      )}
                    </Fragment>
                  );
                })}
              </ol>
            </div>
          </section>
        );
      })}
    </div>
  );
}
