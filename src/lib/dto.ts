import { tm128ToLatLng } from "./geo";
import type { SpotRow } from "./store/types";
import type { EatplMerchant } from "./eatpl/types";

export interface SpotDTO {
  id: string;
  placeName: string;
  location: string;
  sourceUrl: string;
  sourceType: string;
  note: string;
  status: "pending" | "verified";
  verifyCount: number;
  iVerified: boolean;
  iFlagged: boolean;
  mine: boolean;
  createdAt: string;
  merchant: EatplMerchant | null;
  latLng: [number, number] | null;
}

export interface Viewer {
  userId: string | null;
  verified: Set<string>;
  flagged: Set<string>;
}

export function toSpotDTO(s: SpotRow, v: Viewer): SpotDTO {
  const merchant = s.match?.merchant ?? null;
  return {
    id: s.id,
    placeName: s.place_name,
    location: s.location,
    sourceUrl: s.source_url,
    sourceType: s.source_type,
    note: s.note,
    status: s.status === "verified" ? "verified" : "pending",
    verifyCount: s.verify_count,
    iVerified: v.verified.has(s.id),
    iFlagged: v.flagged.has(s.id),
    mine: !!v.userId && s.reporter_id === v.userId,
    createdAt: s.created_at,
    merchant,
    latLng: merchant ? tm128ToLatLng(merchant.xaxsVal, merchant.yaxsVal) : null,
  };
}
