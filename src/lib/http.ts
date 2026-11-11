import { NextResponse } from "next/server";

export const unauthorized = () =>
  NextResponse.json({ error: "로그인이 필요해요.", needLogin: true }, { status: 401 });
