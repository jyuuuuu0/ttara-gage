import { SOURCE_TYPES, type SourceType } from "./types";

/** 사적인 공간을 가리키는 표현. 이런 제보는 받지 않는다. */
const PRIVATE_PATTERNS = /(자택|숙소|기숙사|본가|집\s*앞|집\s*근처|사는\s*곳|동네\s*단골|퇴근길|출근길)/;

export interface SpotInput {
  idolId: string;
  placeName: string;
  location: string;
  sourceUrl: string;
  sourceType: SourceType;
  note: string;
  publicConfirm: boolean;
}

export function validateSpotInput(body: unknown): { ok: true; value: SpotInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const v: SpotInput = {
    idolId: str("idolId"),
    placeName: str("placeName"),
    location: str("location"),
    sourceUrl: str("sourceUrl"),
    sourceType: str("sourceType") as SourceType,
    note: str("note").slice(0, 300),
    publicConfirm: b.publicConfirm === true,
  };
  if (!v.idolId) return { ok: false, error: "아이돌을 선택해 주세요." };
  if (v.placeName.length < 2 || v.placeName.length > 50) return { ok: false, error: "가게 이름을 2~50자로 입력해 주세요." };
  if (v.location.length < 2) return { ok: false, error: "지역(예: 서울 성동구)을 입력해 주세요." };
  let url: URL;
  try { url = new URL(v.sourceUrl); } catch { return { ok: false, error: "출처 링크는 필수예요. 올바른 URL을 넣어 주세요." }; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "출처 링크는 http(s) 주소여야 해요." };
  if (!SOURCE_TYPES.includes(v.sourceType)) return { ok: false, error: "출처 종류를 선택해 주세요." };
  if (!v.publicConfirm) return { ok: false, error: "공개된 콘텐츠에서 확인된 곳인지 체크해 주세요." };
  if (PRIVATE_PATTERNS.test(`${v.placeName} ${v.note}`)) {
    return { ok: false, error: "아티스트의 사적인 생활 공간과 관련된 제보는 받지 않아요." };
  }
  return { ok: true, value: v };
}
