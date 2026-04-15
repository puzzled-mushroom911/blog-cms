import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from './ConnectionContext';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { supabase, connected } = useConnection();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!supabase || !connected) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale/invalid session — clear it silently
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setSessionExpired(false);
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token was successfully refreshed — clear any expiry state
          setSessionExpired(false);
        }

        if (event === 'USER_UPDATED') {
          // Password changed, profile updated, etc.
          setUser(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, connected]);

  // Wrapper for API calls that handles session expiry
  const withAuth = useCallback(async (fn) => {
    try {
      return await fn();
    } catch (err) {
      if (err?.message?.includes('JWT') || err?.message?.includes('token') || err?.status === 401) {
        setSessionExpired(true);
        toast.error('Your session has expired. Please sign in again.');
        await supabase?.auth.signOut();
        return { error: { message: 'Session expired' } };
      }
      throw err;
    }
  }, [supabase]);

  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Not connected to Supabase' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setSessionExpired(false);
    return { error };
  };

  const signUp = async (email, password) => {
    if (!supabase) return { error: { message: 'Not connected to Supabase' } };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, withAuth, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
