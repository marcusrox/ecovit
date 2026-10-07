import { getSupabase } from './supabase';

export function signIn(email: string, password: string) { return getSupabase().auth.signInWithPassword({ email, password }); }
export function signUp(email: string, password: string) {
  return getSupabase().auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
}
export function requestPasswordReset(email: string) {
  return getSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/redefinir-senha` });
}
export function updatePassword(password: string) { return getSupabase().auth.updateUser({ password }); }
export function signOut() { return getSupabase().auth.signOut(); }
