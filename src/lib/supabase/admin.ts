import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * RLS를 우회하는 관리자 클라이언트. 가게 매칭 결과(spots.match) 기록에만 쓴다.
 * 비밀 키는 절대 브라우저로 보내지 않는다 (NEXT_PUBLIC_ 붙이지 말 것).
 */
const SECRET = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const adminClient = () =>
  createClient(SUPABASE_URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
