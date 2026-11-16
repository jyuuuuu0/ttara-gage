/** 잇플 가맹점 API 응답 data[] 한 건 (문서 기준) */
export type YesNo = boolean | "Y" | "N";

/** boolean 또는 "Y"/"N" 을 boolean 으로 */
export const yes = (v: YesNo | null | undefined) => v === true || v === "Y";

/** "월요일" / "월" → "월" */
export const dayChar = (d: string) => (d ?? "").trim().charAt(0);

export interface EatplMerchant {
  merNm: string;
  merAddr: string;
  merTpno: string;
  merTpbuzNm: string;
  /** 전국 동일 업종 내 백분위(%), 낮을수록 상위 */
  allSaleRnk: number;
  /** 시·군·구 내 동일 업종 백분위(%), 낮을수록 상위 */
  ccgSaleRnk: number;
  /** 동네 맛집 여부 (문서상 boolean, 혹시 "Y"/"N" 문자열이 와도 yes()로 판정) */
  loclPrsnPpltYn: YesNo;
  /** 외국인 방문 여부 */
  frnrVsitYn: YesNo;
  /** 회식 적합 여부 (저녁 단체 결제 이력) */
  empyVsitYn: YesNo;
  /** 주요 방문 고객층 Top 3. 예: "30대여성" */
  vistCstmrRnkList: { rk01?: string; rk02?: string; rk03?: string } | null;
  /** HHMM */
  srtTime: string;
  /** HHMM */
  endTime: string;
  /** 휴무 요일 (빈 배열이면 연중무휴) */
  hldyDwk: string[];
  congestionDwk: string;
  congestionTizn: string;
  merUrl: string;
  /** TM128 */
  xaxsVal: string;
  yaxsVal: string;
}

export interface EatplResponse {
  rspCode: string;
  rspMessage: string;
  data: EatplMerchant[];
}

export interface MerchantSearchParams {
  merNm?: string;
  location?: string;
  merTpbuzNm?: string;
}
