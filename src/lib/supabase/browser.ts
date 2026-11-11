import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

export const createBrowser = () => createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
