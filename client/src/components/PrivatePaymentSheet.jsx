import { useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Shield, Send, CheckCircle2, X, ChevronDown, Info } from 'lucide-react';
import { api, DEFAULT_AVATAR } from '../lib/api.js';
import { sendSolTransfer } from '../lib/solTransfer.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivatePaymentSheet({
  open,
  onClose,
  peerId,
  peerUsername,
  peerFullName,
  peerAvatar,
  recipientPubkey,
  recipientWallets,
  onComplete,
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { user } = useAuth();
  const [amount, setAmount] = useState('0.01');
  const [privateMode, setPrivateMode] = useState(false);
  const [selectedFromWallet, setSelectedFromWallet] = useState('');
  const [selectedToWallet, setSelectedToWallet] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'busy', 'success'
  const [error, setError] = useState('');
  const [txDetails, setTxDetails] = useState(null);

  const receiverLabel = peerFullName || (peerUsername ? `@${peerUsername}` : 'Receiver');
  const senderLabel = user?.profile?.full_name || (user?.username ? `@${user.username}` : 'Sender');
  
  const connectedAddress = wallet.publicKey?.toBase58() || '';
  const fromWalletOptions = useMemo(() => {
    const merged = [];
    if (connectedAddress) merged.push({ address: connectedAddress, label: 'Connected wallet' });
    for (const w of user?.wallets || []) {
      if (!w?.public_address) continue;
      if (merged.some((item) => item.address === w.public_address)) continue;
      merged.push({
        address: w.public_address,
        label: w.label || (w.is_primary ? 'Primary wallet' : 'Linked wallet'),
      });
    }
    return merged;
  }, [connectedAddress, user?.wallets]);
  
  const toWalletOptions = useMemo(() => {
    const merged = [];
    for (const w of recipientWallets || []) {
      if (!w?.public_address) continue;
      if (merged.some((item) => item.address === w.public_address)) continue;
      merged.push({
        address: w.public_address,
        label: w.label || (w.is_primary ? 'Primary wallet' : 'Recipient wallet'),
      });
    }
    if (recipientPubkey && !merged.some((item) => item.address === recipientPubkey)) {
      merged.unshift({ address: recipientPubkey, label: 'Recipient wallet' });
    }
    return merged;
  }, [recipientWallets, recipientPubkey]);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError('');
      setTxDetails(null);
      return;
    }
    if (!fromWalletOptions.length) {
      setSelectedFromWallet('');
    } else {
      const defaultAddress = connectedAddress || fromWalletOptions[0].address;
      if (!selectedFromWallet || !fromWalletOptions.some((item) => item.address === selectedFromWallet)) {
        setSelectedFromWallet(defaultAddress);
      }
    }

    if (!toWalletOptions.length) {
      setSelectedToWallet('');
    } else {
      const defaultAddress = recipientPubkey || toWalletOptions[0].address;
      if (!selectedToWallet || !toWalletOptions.some((item) => item.address === selectedToWallet)) {
        setSelectedToWallet(defaultAddress);
      }
    }
  }, [open, fromWalletOptions, toWalletOptions, connectedAddress, recipientPubkey]);

  if (!open) return null;

  const run = async () => {
    setError('');
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError('Connect a Solana wallet first');
      return;
    }
    if (!selectedFromWallet) {
      setError('Choose a sender wallet');
      return;
    }
    if (selectedFromWallet !== connectedAddress) {
      setError('Connect the selected wallet in your wallet extension');
      return;
    }
    if (!selectedToWallet) {
      setError('Recipient has no public key');
      return;
    }
    
    setStatus('busy');
    try {
      const amt = parseFloat(amount);
      if (!(amt > 0)) throw new Error('Invalid amount');

      let txHash;
      let isPrivate = false;

      if (privateMode) {
        const cfg = await api.cloakConfig();
        if (!cfg.configured || !cfg.relayerUrl) {
          throw new Error('Cloak is not configured on this server');
        }
        const { executeCloakSend } = await import('../lib/cloakTransfer.js');
        const { signature } = await executeCloakSend({
          connection,
          walletAdapter: wallet.adapter,
          relayerUrl: cfg.relayerUrl,
          altAddress: cfg.altAddress,
          amountSol: amt,
          recipientAddress: selectedToWallet,
        });
        txHash = signature;
        isPrivate = true;
      } else {
        txHash = await sendSolTransfer({
          connection,
          fromPubkey: new PublicKey(selectedFromWallet),
          sendTransaction: wallet.sendTransaction,
          toAddress: selectedToWallet,
          amountSol: amt,
        });
      }

      const summary = await api.balances(selectedFromWallet).catch(() => null);
      const solUsd = summary?.sol?.value_usd;
      const usdEstimate = solUsd != null ? (amt / (summary.sol.balance || amt)) * solUsd : null;

      const transfer = await api.recordTransfer({
        receiver_id: peerId,
        amount_ui: String(amt),
        amount_usd: usdEstimate,
        status: 'completed',
        is_private: isPrivate,
        tx_hash: txHash,
      });

      await api.sendMessage({
        receiver_id: peerId,
        text: `${isPrivate ? '🔒 Private transfer: ' : 'Sent '}${amt} SOL`,
        related_transfer_id: transfer.id,
      });

      setTxDetails({
        id: transfer.id,
        amount: amt,
        txHash,
        date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        to: receiverLabel,
        from: senderLabel,
        toWallet: selectedToWallet,
        fromWallet: selectedFromWallet,
      });
      
      setStatus('success');
      onComplete?.();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Payment failed');
      setStatus('idle');
    }
  };

  if (status === 'success' && txDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-0 sm:p-4 animate-in fade-in zoom-in duration-300">
        <div className="h-full w-full max-w-md bg-white flex flex-col items-center pt-12 px-6">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>

          <div className="mb-6 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full border border-gray-200 overflow-hidden mb-4 shadow-sm bg-gray-100">
              <img src={peerAvatar || DEFAULT_AVATAR} alt="Recipient" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">To {txDetails.to}</h2>
            <p className="text-4xl font-bold text-gray-900 mt-4">₹{txDetails.amount.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>Completed</span>
            </div>
            <p className="text-sm text-gray-500">{txDetails.date}</p>
          </div>

          <div className="w-full rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm bg-gray-50/50">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-blue-600 shadow-sm">SOL</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Solana Network</p>
                <p className="text-xs text-gray-500 truncate">{txDetails.fromWallet.slice(0, 4)}...{txDetails.fromWallet.slice(-4)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="text-gray-800 font-medium font-mono text-[10px]">{txDetails.txHash.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To: {txDetails.to}</span>
                <span className="text-gray-800 font-medium text-[10px] font-mono">{txDetails.toWallet.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">From: {txDetails.from}</span>
                <span className="text-gray-800 font-medium text-[10px] font-mono">{txDetails.fromWallet.slice(0, 10)}...</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-8 text-center px-8 leading-relaxed">
            Payments may take a few seconds to be reflected on the blockchain.
          </p>

          <div className="mt-auto mb-8 w-full">
             <button 
              onClick={onClose}
              className="w-full rounded-full border border-gray-300 py-3 text-sm font-semibold text-blue-600 hover:bg-gray-50 transition-colors"
             >
              Done
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md rounded-t-[32px] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Pay</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="h-16 w-16 rounded-full border-2 border-blue-50 overflow-hidden mb-3 shadow-sm bg-gray-100">
            <img src={peerAvatar || DEFAULT_AVATAR} alt="Recipient" className="h-full w-full object-cover" />
          </div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Paying to</p>
          <p className="text-lg font-bold text-gray-900">{receiverLabel}</p>
          {peerUsername && <p className="text-sm text-gray-400 font-medium">@{peerUsername}</p>}
          <p className="mt-1 font-mono text-[9px] text-gray-400 break-all px-4 text-center">{selectedToWallet}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              className="w-full rounded-2xl bg-gray-100 border-2 border-transparent focus:border-blue-200 focus:bg-blue-50 px-10 py-5 text-4xl font-bold text-gray-900 outline-none transition-all placeholder:text-gray-200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 uppercase tracking-widest">SOL</div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
             {fromWalletOptions.map((option) => (
              <button
                key={option.address}
                onClick={() => setSelectedFromWallet(option.address)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border-2 transition-all ${
                  selectedFromWallet === option.address 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={`rounded-2xl border transition-all p-4 ${privateMode ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Shield className={`h-3.5 w-3.5 ${privateMode ? 'text-blue-600' : ''}`} />
                  <span className={privateMode ? 'text-blue-600' : ''}>Privacy Mode</span>
                </div>
                <button 
                  onClick={() => setPrivateMode(!privateMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${privateMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${privateMode ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
             <p className="text-[11px] text-gray-400 leading-relaxed">
               Funds route through Cloak's shielded pool to break on-chain links. 
               <Info className="h-3 w-3 inline ml-1 cursor-help" />
             </p>
          </div>
        </div>

        <div className="mb-4 flex flex-col items-center px-4">
          <p className="text-[9px] text-gray-400 font-medium text-center">
            From: <span className="font-mono break-all">{selectedFromWallet}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={status === 'busy'}
          onClick={run}
          className="group relative flex w-full h-[56px] items-center justify-center gap-3 rounded-full bg-blue-600 text-base font-bold text-white shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-95 transition-all overflow-hidden"
        >
          {status === 'busy' ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            <>
              <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              <span>Send SOL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
