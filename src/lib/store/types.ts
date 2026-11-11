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

export interface SpotMatch {
  merchant: EatplMerchant | null;
  score: number;
  matchedAt: string;
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
