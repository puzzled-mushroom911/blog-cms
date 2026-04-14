import { createContext, useContext, useState, useCallback } from 'react';
import { getClient, saveConnection, clearConnection, getStoredConnection, getConnectionMode, setConnectionMode, hasHostedCredentials, HOSTED_URL, HOSTED_ANON_KEY } from '../lib/supabase';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(() => !!getStoredConnection());
  const [mode, setMode] = useState(() => getConnectionMode());

  const connect = useCallback((url, anonKey) => {
    saveConnection(url, anonKey);
    setConnected(true);
    setMode('byo');
  }, []);

  const connectHosted = useCallback(() => {
    if (!hasHostedCredentials) return;
    setConnectionMode('hosted');
    setConnected(true);
    setMode('hosted');
  }, []);

  const disconnect = useCallback(() => {
    clearConnection();
    setConnected(false);
    setMode(null);
  }, []);

  const supabase = connected ? getClient() : null;

  return (
    <ConnectionContext.Provider value={{
      connected,
      supabase,
      connect,
      connectHosted,
      disconnect,
      connectionMode: mode,
      hasHostedCredentials,
    }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
}
