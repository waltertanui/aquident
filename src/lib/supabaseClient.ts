import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_KEY as string;

    if (!url || !key) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in environment.");
    }

    supabase = createClient(url, key);
  }
  return supabase;
}