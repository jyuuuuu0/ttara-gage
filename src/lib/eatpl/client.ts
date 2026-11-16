import "server-only";
import { mockSearch } from "./mock";
import type { EatplMerchant, EatplResponse, MerchantSearchParams } from "./types";

/**
 * 잇플 가맹점 검색 API 클라이언트
 *
 * EATPL_MODE=mock   : 목업 데이터 (기본값)
 * EATPL_MODE=kskill : K-Skill 공개 프록시 경유 (BC카드와 협력, 기관코드·고정 IP 불필요)
 * EATPL_MODE=live   : 잇플 API 직접 호출 (기관코드 + 등록된 고정 IP 필요)
 *
 * 실제 API는 사전 등록된 고정 IP에서만 호출된다.
 * - 고정 IP 서버에서 이 앱을 직접 띄우면: EATPL_BASE_URL 만 설정
 * - Vercel 처럼 IP가 바뀌는 곳에 띄우면: 고정 IP 서버에 relay/server.mjs 를 띄우고
 *   EATPL_RELAY_URL, EATPL_RELAY_SECRET 를 설정 (요청은 중계 서버를 거쳐 잇플로 간다)
 */
const MODE = process.env.EATPL_MODE ?? "mock";
const BASE_URL = (process.env.EATPL_BASE_URL ?? "https://dev-api.paybooc.ai/api/mer").replace(/\/$/, "");
const INST_NM = process.env.EATPL_INST_NM ?? "";
const RELAY_URL = (process.env.EATPL_RELAY_URL ?? "").replace(/\/$/, "");
const RELAY_SECRET = process.env.EATPL_RELAY_SECRET ?? "";
const TIMEOUT_MS = Number(process.env.EATPL_TIMEOUT_MS ?? 8000);
const KSKILL_BASE = (process.env.KSKILL_PROXY_BASE_URL ?? "https://k-skill-proxy.nomadamas.org").replace(/\/$/, "");
/** 최근 1개월 집계 데이터라 같은 조건은 6시간 캐시 */
const REVALIDATE_SEC = 60 * 60 * 6;

let seq = 0;
/** 거래추적번호: {기관명}{YYYYMMDD}{10자리 seq}. 서버리스 인스턴스 간 충돌을 줄이려고 시각+카운터를 섞는다. */
function makeTrnsTrceNo(): string {
  const kst = new Date(Date.now() + 9 * 3600_000);
  const ymd = kst.toISOString().slice(0, 10).replace(/-/g, "");
  seq = (seq + 1) % 10_000;
  const tail = `${(Date.now() % 1_000_000).toString().padStart(6, "0")}${seq.toString().padStart(4, "0")}`;
  return `${INST_NM}${ymd}${tail}`;
}

export class EatplError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

export async function searchMerchants(p: MerchantSearchParams): Promise<EatplMerchant[]> {
  if (!p.merNm && !p.location && !p.merTpbuzNm) {
    throw new EatplError("merNm, location, merTpbuzNm 중 하나 이상이 필요합니다.");
  }
  if (MODE === "kskill") return searchViaKskill(clean(p));
  if (MODE !== "live") return mockSearch(p);
  if (!INST_NM) throw new EatplError("EATPL_INST_NM(기관명)이 설정되지 않았습니다.");

  const body = JSON.stringify({ trnsTrceNo: makeTrnsTrceNo(), instNm: INST_NM, ...clean(p) });
  const url = RELAY_URL ? `${RELAY_URL}/v1/search` : `${BASE_URL}/v1/search`;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (RELAY_URL) headers["x-relay-secret"] = RELAY_SECRET;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SEC },
    });
  } catch (e) {
    throw new EatplError(`가게 정보 API에 연결하지 못했어요: ${(e as Error).message}`);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[eatpl] HTTP", res.status, text.slice(0, 500));
    throw new EatplError(`가게 정보 API HTTP ${res.status}`, String(res.status));
  }
  let json: EatplResponse;
  try {
    json = JSON.parse(text) as EatplResponse;
  } catch {
    console.error("[eatpl] JSON 아님", text.slice(0, 500));
    throw new EatplError("가게 정보 API 응답을 읽지 못했어요.");
  }
  if (json.rspCode !== "00000") {
    console.error("[eatpl] 오류 응답", json.rspCode, json.rspMessage);
    throw new EatplError(`가게 정보 API 오류 ${json.rspCode}: ${json.rspMessage}`, json.rspCode);
  }
  return Array.isArray(json.data) ? json.data : [];
}

/** K-Skill 프록시: GET /v1/bccard-eatpl/search → { items, attribution } */
async function searchViaKskill(p: MerchantSearchParams): Promise<EatplMerchant[]> {
  const qs = new URLSearchParams(p as Record<string, string>);
  let res: Response;
  try {
    res = await fetch(`${KSKILL_BASE}/v1/bccard-eatpl/search?${qs}`, {
      headers: { Accept: "application/json", "User-Agent": "ttara-gage/1.0 (+https://ttara-gage.vercel.app)" },
      signal: AbortSignal.timeout(Math.max(TIMEOUT_MS, 15000)),
      next: { revalidate: REVALIDATE_SEC },
    });
  } catch (e) {
    throw new EatplError(`가게 정보 API에 연결하지 못했어요: ${(e as Error).message}`);
  }
  const text = await res.text();
  let json: { items?: EatplMerchant[]; error?: string; message?: string };
  try {
    json = JSON.parse(text);
  } catch {
    console.error("[eatpl/kskill] JSON 아님", res.status, text.slice(0, 300));
    throw new EatplError("가게 정보 API 응답을 읽지 못했어요.");
  }
  if (!res.ok || json.error) {
    console.error("[eatpl/kskill] 오류", res.status, json.error, json.message);
    throw new EatplError(`가게 정보 API 오류 ${json.error ?? res.status}`, json.error ?? String(res.status));
  }
  return Array.isArray(json.items) ? json.items : [];
}

function clean(p: MerchantSearchParams) {
  const out: MerchantSearchParams = {};
  if (p.merNm?.trim()) out.merNm = p.merNm.trim();
  if (p.location?.trim()) out.location = p.location.trim();
  if (p.merTpbuzNm?.trim()) out.merTpbuzNm = p.merTpbuzNm.trim();
  return out;
}

export const eatplMode = (): "mock" | "live" | "kskill" => (MODE === "live" || MODE === "kskill" ? MODE : "mock");
