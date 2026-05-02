import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Send, Lock, Unlock } from 'lucide-react';

export function Transfer() {
  const { id: contactId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, API_BASE, getHeaders } = useContext(AuthContext);
  const [contact, setContact] = useState(location.state?.contact);
  const [messages, setMessages] = useState([]);
  const [amount, setAmount] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTransferHistory();
  }, [token, contactId]);

  const fetchTransferHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/transfer/history/${contactId}`, {
        headers: getHeaders(),
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch transfer history:', error);
    }
  };

  const handleSendTransfer = async (e) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/transfer/`,
        {
          receiverId: contactId,
          amountUi: parseFloat(amount),
          amountUsd: parseFloat(amount) * 140, // Mock conversion
          isPrivate,
        },
        { headers: getHeaders() }
      );

      setMessages([...messages, response.data]);
      setAmount('');
      setIsPrivate(false);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">@{contact.contactUser.username}</h1>
            <p className="text-xs text-gray-500">{contact.displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {contact.contactUser.username[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Messages / Transfer History */}
      <div className="flex-1 max-w-md mx-auto px-4 py-6 overflow-y-auto space-y-4 pb-32">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No transfers yet. Send one below!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === contactId ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  msg.senderId === contactId
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-primary text-dark'
                } break-words`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">${msg.amountUi}</span>
                  {msg.isPrivate && <Lock className="w-4 h-4" />}
                </div>
                <p className="text-xs opacity-75">{new Date(msg.createdAt).toLocaleString()}</p>
                {msg.txHash && (
                  <p className="text-xs opacity-50 mt-1 font-mono">{msg.txHash.substring(0, 8)}...</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Transfer Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
        <form onSubmit={handleSendTransfer} className="p-4 space-y-3">
          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition ${
              isPrivate
                ? 'bg-purple-500/20 text-purple-600 border border-purple-500/50'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="text-sm font-semibold">{isPrivate ? 'Shielded Payment' : 'Standard Payment'}</span>
          </button>

          {/* Amount Input */}
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Amount in SOL"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              disabled={loading || !amount}
              className="bg-primary text-dark rounded-lg px-6 py-3 font-semibold hover:bg-opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>

          {isPrivate && (
            <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
              💜 Private transfers hide the link between sender and receiver on-chain using Cloak protocol.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
