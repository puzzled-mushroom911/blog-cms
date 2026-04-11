import { createContext, useContext, useState, useCallback } from 'react';
import { getClient, saveConnection, clearConnection, getStoredConnection } from '../lib/supabase';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(() => !!getStoredConnection());

  const connect = useCallback((url, anonKey) => {
    saveConnection(url, anonKey);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    clearConnection();
    setConnected(false);
  }, []);

  const supabase = connected ? getClient() : null;

  return (
    <ConnectionContext.Provider value={{ connected, supabase, connect, disconnect }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
}
