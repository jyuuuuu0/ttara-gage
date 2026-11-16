import type { EatplMerchant } from "./eatpl/types";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 붐비는 시간대 구간 (문서 기준) */
const SLOTS: { name: string; from: number; to: number }[] = [
  { name: "새벽", from: 0, to: 6 },
  { name: "오전", from: 6, to: 11 },
  { name: "점심", from: 11, to: 14 },
  { name: "오후", from: 14, to: 17 },
  { name: "저녁", from: 17, to: 21 },
  { name: "심야", from: 21, to: 24 },
];

export interface KstNow { day: string; prevDay: string; minutes: number; slot: string }

export function kstNow(date = new Date()): KstNow {
  const k = new Date(date.getTime() + 9 * 3600_000);
  const d = k.getUTCDay();
  const minutes = k.getUTCHours() * 60 + k.getUTCMinutes();
  const slot = SLOTS.find((s) => minutes >= s.from * 60 && minutes < s.to * 60)!.name;
  return { day: DAYS[d], prevDay: DAYS[(d + 6) % 7], minutes, slot };
}

const toMin = (hhmm: string) => {
  const n = Number(hhmm);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n / 100) * 60 + (n % 100);
};
const isHoliday = (m: EatplMerchant, day: string) => (m.hldyDwk ?? []).some((h) => h.trim().startsWith(day));

export type OpenState = "open" | "closed" | "holiday" | "unknown";

/** 결제 승인 시각 기반 영업시간으로 현재 영업 여부 추정 (자정 넘김 처리) */
export function openState(m: EatplMerchant, now = kstNow()): OpenState {
  const s = toMin(m.srtTime), e = toMin(m.endTime);
  if (Number.isNaN(s) || Number.isNaN(e)) return "unknown";
  const t = now.minutes;
  if (s === 0 && e >= 1440) return isHoliday(m, now.day) ? "holiday" : "open";

  if (e > s) {
    if (isHoliday(m, now.day)) return "holiday";
    return t >= s && t < e ? "open" : "closed";
  }
  // 자정을 넘기는 영업 (예: 1800~0200)
  if (t >= s) return isHoliday(m, now.day) ? "holiday" : "open";
  if (t < e) return isHoliday(m, now.prevDay) ? "closed" : "open";
  return isHoliday(m, now.day) ? "holiday" : "closed";
}

/** 지금이 이 가게의 가장 붐비는 요일+시간대인지 */
export function isPeakNow(m: EatplMerchant, now = kstNow()): boolean {
  return !!m.congestionDwk && m.congestionDwk.trim().startsWith(now.day) && (m.congestionTizn ?? "").trim() === now.slot;
}

export const formatHHMM = (hhmm: string) =>
  hhmm && hhmm.length === 4 ? `${hhmm.slice(0, 2)}:${hhmm.slice(2)}` : hhmm;
