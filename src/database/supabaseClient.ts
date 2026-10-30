import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://avckklrjxfpsqeaeyvhb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OZoLnoSi51TgOCrgooO47g_nTbYiKbQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if Supabase is reachable
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
