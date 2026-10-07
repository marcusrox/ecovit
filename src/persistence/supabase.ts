import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && /^https:\/\/[a-zA-Z0-9.-]+\/?$/.test(url) && key?.startsWith('sb_publishable_'));
const client = isSupabaseConfigured ? createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export function getSupabase() {
  if (!client) throw new AppError('NOT_CONFIGURED');
  return client;
}
