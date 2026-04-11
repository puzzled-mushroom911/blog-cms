import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConnectionProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConnectionProvider>
    </BrowserRouter>
  </StrictMode>
);
