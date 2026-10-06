import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qqqulivaorvxcxcoqnpq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dQ6QQqWhFnGtu-gOyGQlaw_4KmPQQy6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
