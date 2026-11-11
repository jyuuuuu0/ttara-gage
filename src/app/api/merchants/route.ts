import { NextResponse } from "next/server";
import { EatplError, searchMerchants } from "@/lib/eatpl/client";
import { tm128ToLatLng } from "@/lib/geo";

/** 잇플 가맹점 검색 프록시 (고정 IP 제약 때문에 브라우저는 이 라우트를 거친다) */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const merNm = sp.get("merNm")?.trim() || undefined;
  const location = sp.get("location")?.trim() || undefined;
  const merTpbuzNm = sp.get("merTpbuzNm")?.trim() || undefined;
  try {
    const data = await searchMerchants({ merNm, location, merTpbuzNm });
    return NextResponse.json({
      merchants: data.slice(0, 20).map((m) => ({ ...m, latLng: tm128ToLatLng(m.xaxsVal, m.yaxsVal) })),
    });
  } catch (e) {
    const status = e instanceof EatplError ? 400 : 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
