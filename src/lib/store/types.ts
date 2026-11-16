import type { EatplMerchant } from "../eatpl/types";

export interface Idol {
  id: string;
  name: string;
  /** 소속 그룹. 솔로면 undefined + solo=true */
  group?: string;
  solo?: boolean;
  agency?: string;
  /** 프로필 사진 주소 (선택) */
  imageUrl?: string;
  aliases: string[];
  createdAt: string;
}

export type SourceType = "방송" | "본인 SNS" | "공식 콘텐츠" | "인터뷰" | "기타 공개 콘텐츠";
export const SOURCE_TYPES: SourceType[] = ["방송", "본인 SNS", "공식 콘텐츠", "인터뷰", "기타 공개 콘텐츠"];

export type SpotStatus = "pending" | "verified" | "hidden";

/**
 * 가게 매칭 결과. 공모전 약관(제9조의2 3항)에 따라 잇플 원본 데이터는 DB에 쌓지 않고,
 * 어느 가맹점인지 식별하는 키(가맹점명·주소)만 저장한다. 영업시간 등은 표시할 때마다 다시 조회한다.
 */
export interface SpotMatch {
  key: { merNm: string; merAddr: string } | null;
  score: number;
  matchedAt: string;
  /** @deprecated 예전 버전이 저장하던 원본 데이터. 읽을 때 키로만 쓴다. */
  merchant?: EatplMerchant | null;
}

/** DB public.idols 행 */
export interface IdolRow {
  id: string;
  name: string;
  group_name: string | null;
  solo: boolean;
  agency: string | null;
  image_url: string | null;
  aliases: string[];
  created_at: string;
}

/** DB public.spots 행 */
export interface SpotRow {
  id: string;
  idol_id: string;
  place_name: string;
  location: string;
  source_url: string;
  source_type: SourceType;
  note: string;
  status: SpotStatus;
  verify_count: number;
  flag_count: number;
  match: SpotMatch | null;
  reporter_id: string | null;
  created_at: string;
}

/** SQL 트리거(refresh_spot_status)와 같은 값으로 유지 */
export const VERIFY_THRESHOLD = 3;
export const FLAG_THRESHOLD = 2;

export function rowToIdol(r: IdolRow): Idol {
  return {
    id: r.id,
    name: r.name,
    group: r.group_name ?? undefined,
    solo: r.solo || undefined,
    agency: r.agency ?? undefined,
    imageUrl: r.image_url ?? undefined,
    aliases: r.aliases ?? [],
    createdAt: r.created_at,
  };
}
