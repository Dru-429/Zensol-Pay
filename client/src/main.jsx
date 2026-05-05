import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Buffer } from 'buffer';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider.jsx';

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SolanaWalletProvider>
          <App />
        </SolanaWalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
