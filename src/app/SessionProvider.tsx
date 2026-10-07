import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../persistence/supabase';
import { SessionContext } from './session-context';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ session: Session | null; loading: boolean; error: string | null }>({ session: null, loading: isSupabaseConfigured, error: null });
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let receivedEvent = false;
    const auth = getSupabase().auth;
    const { data } = auth.onAuthStateChange((_event, session) => {
      receivedEvent = true;
      if (active) setState({ session, loading: false, error: null });
    });
    void auth.getSession().then(({ data, error }) => {
      if (active && !receivedEvent) setState({ session: data.session, loading: false, error: error ? 'Não foi possível verificar a sessão. Recarregue a página.' : null });
    }).catch(() => { if (active) setState({ session: null, loading: false, error: 'Falha ao verificar a sessão. Recarregue a página.' }); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
