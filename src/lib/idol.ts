import type { Idol } from "./store/types";

type Aff = Pick<Idol, "group" | "solo" | "agency">;

/** 소속 한 줄: 그룹(또는 솔로)과 소속사 */
export function affiliationParts(i: Aff): { group: string | null; agency: string | null } {
  return { group: i.solo ? "솔로" : i.group ?? null, agency: i.agency ?? null };
}

/** 텍스트 한 줄이 필요할 때 (괄호 표기) */
export function affiliation(i: Aff): string {
  const { group, agency } = affiliationParts(i);
  if (group && agency) return `${group}, ${agency}`;
  return group ?? agency ?? "";
}

