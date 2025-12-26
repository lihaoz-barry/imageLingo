'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// Demo mode check
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Mock user for demo mode
const MOCK_USER: User = {
  id: 'demo-user-00000000-0000-0000-0000-000000000000',
  app_metadata: {},
  user_metadata: {
    avatar_url: null,
    full_name: 'Demo User'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@imagelingo.com',
  phone: '',
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  isDemoMode: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(isDemoMode ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [isConfigured] = useState(() => isDemoMode || isSupabaseConfigured());

  useEffect(() => {
    // In demo mode, skip all Supabase initialization
    if (isDemoMode) {
      return;
    }

    if (!isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Early return for unconfigured state is intentional
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signUp = async (email: string, password: string) => {
    if (isDemoMode) {
      return { error: null };
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      return { error: null };
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode) {
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isConfigured, isDemoMode, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

