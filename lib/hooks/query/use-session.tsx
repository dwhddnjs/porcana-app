import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/hooks/zustand/use-user-store';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export const useSession = () => {
  const syncFromSession = useUserStore((s) => s.syncFromSession);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      syncFromSession(data.session);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      syncFromSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  return { session, isLoading };
};
