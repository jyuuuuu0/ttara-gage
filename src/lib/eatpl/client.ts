import "server-only";
import { mockSearch } from "./mock";
import type { EatplMerchant, EatplResponse, MerchantSearchParams } from "./types";

const MODE = process.env.EATPL_MODE ?? "mock";
const BASE_URL = process.env.EATPL_BASE_URL ?? "https://dev-api.paybooc.ai/api/mer";
const INST_NM = process.env.EATPL_INST_NM ?? "";

let seq = 0;
/** 거래추적번호: {기관명}{YYYYMMDD}{10자리 seq} */
function makeTrnsTrceNo(): string {
  const kst = new Date(Date.now() + 9 * 3600_000);
  const ymd = kst.toISOString().slice(0, 10).replace(/-/g, "");
  seq = (seq + 1) % 1_000_000;
  const s = `${Date.now() % 10_000}${String(seq).padStart(6, "0")}`.slice(-10).padStart(10, "0");
  return `${INST_NM}${ymd}${s}`;
}

export class EatplError extends Error {}

/**
 * 가맹점 검색. 잇플 API는 사전 등록된 고정 IP에서만 호출 가능하므로
 * 반드시 서버(Route Handler)에서만 사용한다.
 */
export async function searchMerchants(p: MerchantSearchParams): Promise<EatplMerchant[]> {
  if (!p.merNm && !p.location && !p.merTpbuzNm) {
    throw new EatplError("merNm, location, merTpbuzNm 중 하나 이상이 필요합니다.");
  }
  if (MODE !== "live") return mockSearch(p);

  if (!INST_NM) throw new EatplError("EATPL_INST_NM(기관명)이 설정되지 않았습니다.");
  const res = await fetch(`${BASE_URL}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trnsTrceNo: makeTrnsTrceNo(), instNm: INST_NM, ...p }),
    next: { revalidate: 60 * 60 * 6 }, // 데이터가 최근 1개월 집계라 6시간 캐시
  });
  if (!res.ok) throw new EatplError(`가게 정보 API HTTP ${res.status}`);
  const json = (await res.json()) as EatplResponse;
  if (json.rspCode !== "00000") throw new EatplError(`가게 정보 API 오류 ${json.rspCode}: ${json.rspMessage}`);
  return json.data ?? [];
}

export const eatplMode = () => (MODE === "live" ? "live" : "mock");
