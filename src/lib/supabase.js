import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vgrwzvajhrrmmqkcvnob.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ClqTyOYCnTxHRS9pHz5YRg_H8i71P8R'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
