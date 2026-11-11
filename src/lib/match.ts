import type { EatplMerchant } from "./eatpl/types";

const norm = (s: string) =>
  s.replace(/\s+/g, "").replace(/[()\[\]·.,\-_]/g, "").replace(/(본점|직영점)$/g, "").toLowerCase();

/** 문자 bigram Dice 유사도 (0~1) */
export function similarity(a: string, b: string): number {
  const x = norm(a), y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1);
    return m;
  };
  const gx = grams(x), gy = grams(y);
  let inter = 0;
  for (const [g, c] of gx) inter += Math.min(c, gy.get(g) ?? 0);
  const total = Math.max(x.length - 1, 1) + Math.max(y.length - 1, 1);
  return (2 * inter) / total;
}

export interface MatchResult { merchant: EatplMerchant; score: number }

/** 제보된 가게명+지역으로 검색 결과 중 가장 그럴듯한 가맹점 선택. 임계값 미만이면 null */
export function pickBestMatch(name: string, location: string, candidates: EatplMerchant[], threshold = 0.5): MatchResult | null {
  let best: MatchResult | null = null;
  for (const c of candidates) {
    let score = similarity(name, c.merNm);
    if (norm(c.merNm).includes(norm(name)) || norm(name).includes(norm(c.merNm))) score = Math.max(score, 0.8);
    if (location && norm(c.merAddr).includes(norm(location))) score += 0.1;
    if (!best || score > best.score) best = { merchant: c, score: Math.min(score, 1) };
  }
  return best && best.score >= threshold ? best : null;
}
