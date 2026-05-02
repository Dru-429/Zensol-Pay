import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Search, QrCode, Send, ArrowDown, Zap } from 'lucide-react';

export function Dashboard() {
  const { token, user, logout, API_BASE, getHeaders } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchContacts();
    fetchBalance();
  }, [token]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/contact/`, {
        headers: getHeaders(),
      });
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchBalance = async () => {
    setLoading(true);
    try {
      // Mock balance fetch - in production, integrate Dune API
      setBalance({
        sol: (Math.random() * 10).toFixed(2),
        usdc: (Math.random() * 1000).toFixed(2),
        totalUsd: (Math.random() * 2000).toFixed(2),
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contact) => {
    navigate(`/transfer/${contact.contactUserId}`, { state: { contact } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">SolPay</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-20">
        {/* Search & QR Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search @username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="bg-primary text-dark p-3 rounded-lg hover:bg-opacity-90 transition">
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-emerald-400 text-dark rounded-2xl p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-2">Total Balance</p>
          <h2 className="text-3xl font-bold mb-6">${balance?.totalUsd || '0.00'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-75">SOL</p>
              <p className="font-semibold">{balance?.sol || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">USDC</p>
              <p className="font-semibold">{balance?.usdc || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={fetchBalance}
            className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary transition"
          >
            <ArrowDown className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold">Check Balance</span>
          </button>
          <button className="bg-primary text-dark rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-opacity-90 transition">
            <Send className="w-6 h-6" />
            <span className="text-sm font-semibold">Send</span>
          </button>
        </div>

        {/* Recent Contacts - Horizontal Scroll */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Contacts</h3>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 w-max">
              {contacts
                .filter((c) => c.isRecent)
                .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className="flex flex-col items-center gap-2 min-w-max hover:opacity-80 transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold">
                      {contact.contactUser.username[0].toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-700 max-w-[60px] truncate">@{contact.contactUser.username}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* All Contacts - Vertical List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">People</h3>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-primary transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {contact.contactUser.username[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">@{contact.contactUser.username}</p>
                    <p className="text-xs text-gray-500">{contact.displayName}</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
