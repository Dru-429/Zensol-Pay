import './polyfills.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider.jsx';

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
