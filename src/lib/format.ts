/** 매출 랭킹 백분위 표기: 1% 미만은 소수점을 살린다 (0.0%로 보이지 않게) */
export function formatRank(pct: number): string {
  if (!Number.isFinite(pct)) return "-";
  if (pct < 1) {
    const digits = pct < 0.1 ? 2 : 1;
    return `상위 ${pct.toFixed(digits)}%`;
  }
  return `상위 ${Math.round(pct)}%`;
}

export const BRAND = "따라가게";
export const TAGLINE = "최애가 간 가게, 나도 따라가게";
