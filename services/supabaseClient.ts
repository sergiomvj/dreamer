import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl) console.error("CRITICAL: SUPABASE_URL is missing.");
if (!supabaseAnonKey) console.error("CRITICAL: SUPABASE_KEY is missing.");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

