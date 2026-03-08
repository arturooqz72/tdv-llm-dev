import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hobdiyssfsjdwkacgnwv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gjOF8eia7aVEMaTu69amkQ__4SPMpTB";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
