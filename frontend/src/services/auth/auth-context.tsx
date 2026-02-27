import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { getSession, setSession, type Session } from './session';
import { apiRequest } from '../http';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(accessToken: string): Promise<Session | null> {
  const profile = await apiRequest<{ id: string; roles: string[]; status: string; email?: string }>('/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return {
    userId: profile.id,
    roles: profile.roles ?? [],
    status: (profile.status as Session['status']) ?? 'unknown',
    accessToken,
    email: profile.email
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState<Session | null>(getSession());

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const accessToken = data.session?.access_token;
      if (accessToken) {
        const next = await loadProfile(accessToken);
        setSession(next);
        setSessionState(next);
      } else {
        setSession(null);
        setSessionState(null);
      }
      setLoading(false);
    };

    init().catch(() => {
      if (!active) return;
      setSession(null);
      setSessionState(null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      const accessToken = newSession?.access_token;
      if (accessToken) {
        const next = await loadProfile(accessToken);
        setSession(next);
        setSessionState(next);
      } else {
        setSession(null);
        setSessionState(null);
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: sessionState,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, fullName) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      }
    }),
    [sessionState, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
