import { createContext, useContext, useEffect, useState } from 'react';
import { useConnection } from './ConnectionContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { supabase, connected } = useConnection();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !connected) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, connected]);

  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Not connected to Supabase' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
