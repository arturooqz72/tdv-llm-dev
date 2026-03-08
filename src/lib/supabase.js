import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hobdiyssfsjdwkacgnwv.supabase.co"
const supabaseKey = "sb_publishable_gjOF8eia7aVEMaTu69amkQ__4SPMpTB"

export const supabase = createClient(supabaseUrl, supabaseKey)
