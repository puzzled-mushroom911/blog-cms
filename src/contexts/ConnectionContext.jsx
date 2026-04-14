import { createContext, useContext, useState, useCallback } from 'react';
import { getClient, saveConnection, clearConnection, getStoredConnection, isHostedMode } from '../lib/supabase';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  // In hosted mode, we're always connected (env vars provide credentials)
  const [connected, setConnected] = useState(() => isHostedMode || !!getStoredConnection());

  const connect = useCallback((url, anonKey) => {
    saveConnection(url, anonKey);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    if (isHostedMode) return; // Can't disconnect in hosted mode
    clearConnection();
    setConnected(false);
  }, []);

  const supabase = connected ? getClient() : null;

  return (
    <ConnectionContext.Provider value={{ connected, supabase, connect, disconnect, isHostedMode }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
}
