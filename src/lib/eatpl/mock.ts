import type { EatplMerchant, MerchantSearchParams } from "./types";

/**
 * 목업 가맹점 데이터. 모두 가상의 가게이며, 필드 구조는 잇플 API 문서와 같다.
 * 좌표는 TM128 (실제 응답과 동일한 형식).
 */
export const MOCK_MERCHANTS: EatplMerchant[] = [
  m("모먼트 커피 성수", "서울 성동구 성수동2가 301-12", "카페", 3.2, 0.8, false, true, false, ["20대여성", "30대여성", "20대남성"], "0900", "2200", [], "토", "오후", "316750", "549571"),
  m("성수 소금빵 공방", "서울 성동구 성수동1가 685-3", "베이커리", 1.4, 0.4, false, true, false, ["20대여성", "30대여성", "40대여성"], "1000", "2000", ["월"], "일", "오후", "317031", "549413"),
  m("뚝섬 연탄갈비", "서울 성동구 성수동1가 13-5", "고기구이", 12.5, 4.1, true, false, true, ["30대남성", "40대남성", "20대남성"], "1600", "0100", ["일"], "금", "저녁", "316346", "549842"),
  m("홍대 마라공방", "서울 마포구 서교동 358-1", "마라탕", 0.6, 0.2, false, true, false, ["20대여성", "10대여성", "20대남성"], "1100", "2300", [], "토", "점심", "305091", "550995"),
  m("연남 떡볶이집", "서울 마포구 동교동 147-9", "분식", 7.8, 2.6, true, false, false, ["10대여성", "20대여성", "20대남성"], "1130", "2100", ["화"], "토", "오후", "304928", "550642"),
  m("상수 이자카야 하루", "서울 마포구 상수동 93-4", "주점", 22.1, 9.3, false, true, true, ["30대남성", "20대남성", "30대여성"], "1800", "0200", ["일"], "금", "심야", "305358", "550392"),
  m("압구정 한우 오마카세", "서울 강남구 신사동 640-1", "고기구이", 0.3, 0.05, false, true, true, ["40대남성", "50대남성", "30대남성"], "1700", "2300", ["일"], "목", "저녁", "314344", "547664"),
  m("청담 브런치 하우스", "서울 강남구 청담동 89-3", "카페", 5.5, 1.9, false, true, false, ["30대여성", "20대여성", "40대여성"], "0900", "1800", [], "일", "점심", "315324", "547577"),
  m("상무지구 국밥", "광주 서구 치평동 1200-5", "일반한식", 15.0, 3.3, true, false, true, ["40대남성", "30대남성", "50대남성"], "0000", "2400", [], "토", "점심", "295684", "283617"),
  m("동명동 카페 결", "광주 동구 동명동 200-12", "카페", 4.2, 0.9, true, false, false, ["20대여성", "30대여성", "20대남성"], "1100", "2200", ["수"], "토", "오후", "301262", "283666"),
];

function m(
  merNm: string, merAddr: string, merTpbuzNm: string,
  allSaleRnk: number, ccgSaleRnk: number,
  loclPrsnPpltYn: boolean, frnrVsitYn: boolean, empyVsitYn: boolean,
  visitors: string[], srtTime: string, endTime: string, hldyDwk: string[],
  congestionDwk: string, congestionTizn: string, xaxsVal: string, yaxsVal: string,
): EatplMerchant {
  return {
    merNm, merAddr, merTpno: "02-000-0000", merTpbuzNm, allSaleRnk, ccgSaleRnk,
    loclPrsnPpltYn, frnrVsitYn, empyVsitYn,
    vistCstmrRnkList: { rk01: visitors[0], rk02: visitors[1], rk03: visitors[2] },
    srtTime, endTime, hldyDwk, congestionDwk, congestionTizn,
    merUrl: "https://eat.pl/", xaxsVal, yaxsVal,
  };
}

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

export function mockSearch(p: MerchantSearchParams): EatplMerchant[] {
  return MOCK_MERCHANTS.filter((mer) => {
    if (p.merNm && !norm(mer.merNm).includes(norm(p.merNm)) && !norm(p.merNm).includes(norm(mer.merNm))) return false;
    if (p.location && !norm(mer.merAddr).includes(norm(p.location))) return false;
    if (p.merTpbuzNm && mer.merTpbuzNm !== p.merTpbuzNm) return false;
    return true;
  }).sort((a, b) => a.allSaleRnk - b.allSaleRnk);
}
