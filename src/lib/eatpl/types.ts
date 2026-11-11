/** 잇플 가맹점 API 응답 data[] 한 건 (문서 기준) */
export interface EatplMerchant {
  merNm: string;
  merAddr: string;
  merTpno: string;
  merTpbuzNm: string;
  /** 전국 동일 업종 내 백분위(%), 낮을수록 상위 */
  allSaleRnk: number;
  /** 시·군·구 내 동일 업종 백분위(%), 낮을수록 상위 */
  ccgSaleRnk: number;
  loclPrsnPpltYn: "Y" | "N";
  frnrVsitYn: "Y" | "N";
  empyVsitYn: "Y" | "N";
  vistCstmrRnkList: { rk01?: string; rk02?: string; rk03?: string };
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
