import { useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Shield, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { sendSolTransfer } from '../lib/solTransfer.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivatePaymentSheet({
  open,
  onClose,
  peerId,
  peerUsername,
  peerFullName,
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const receiverLabel = peerFullName || (peerUsername ? `@${peerUsername}` : 'Receiver');
  const senderLabel = user?.profile?.full_name || (user?.username ? `@${user.username}` : 'Sender');
  const receiverInitial = (peerFullName || peerUsername || '?').slice(0, 1).toUpperCase();
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
    if (!open) return;
    if (!fromWalletOptions.length) {
      setSelectedFromWallet('');
      return;
    }
    const defaultAddress = connectedAddress || fromWalletOptions[0].address;
    if (!selectedFromWallet || !fromWalletOptions.some((item) => item.address === selectedFromWallet)) {
      setSelectedFromWallet(defaultAddress);
    }
  }, [open, fromWalletOptions, connectedAddress, selectedFromWallet]);

  useEffect(() => {
    if (!open) return;
    if (!toWalletOptions.length) {
      setSelectedToWallet('');
      return;
    }
    const defaultAddress = recipientPubkey || toWalletOptions[0].address;
    if (!selectedToWallet || !toWalletOptions.some((item) => item.address === selectedToWallet)) {
      setSelectedToWallet(defaultAddress);
    }
  }, [open, toWalletOptions, recipientPubkey, selectedToWallet]);

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
      setError('Connect the selected wallet in your wallet extension to send from it');
      return;
    }
    if (!selectedToWallet) {
      setError('Recipient has no public key on file');
      return;
    }
    setBusy(true);
    try {
      const amt = parseFloat(amount);
      if (!(amt > 0)) throw new Error('Invalid amount');

      let txHash;
      let isPrivate = false;

      if (privateMode) {
        const cfg = await api.cloakConfig();
        if (!cfg.configured || !cfg.relayerUrl) {
          throw new Error('Server has no CLOAK_RELAYER_URL — enable Cloak in server .env');
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

      onComplete?.();
      onClose();
      setAmount('0.01');
      setPrivateMode(false);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border border-theme bg-secondary p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pay</h3>
          <button type="button" onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-theme bg-primary px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-muted">PAYING TO</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="avatar-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
              {receiverInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-secondary">{receiverLabel}</p>
              {peerUsername && <p className="truncate text-xs text-muted">@{peerUsername}</p>}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>From</span>
            <span className="truncate font-medium text-secondary">{senderLabel}</span>
          </div>
        </div>

        <label className="mb-2 block text-xs text-muted">From wallet</label>
        <select
          className="mb-4 w-full rounded-2xl border border-theme bg-primary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
          value={selectedFromWallet}
          onChange={(e) => setSelectedFromWallet(e.target.value)}
        >
          {fromWalletOptions.map((option) => (
            <option key={option.address} value={option.address}>
              {option.label} ({option.address.slice(0, 4)}...{option.address.slice(-4)})
            </option>
          ))}
        </select>
        {selectedFromWallet && (
          <p className="mb-4 break-all rounded-xl border border-theme bg-primary px-3 py-2 text-xs text-muted">
            Sending wallet: {selectedFromWallet}
          </p>
        )}

        <label className="mb-2 block text-xs text-muted">To wallet</label>
        <select
          className="mb-2 w-full rounded-2xl border border-theme bg-primary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
          value={selectedToWallet}
          onChange={(e) => setSelectedToWallet(e.target.value)}
        >
          {toWalletOptions.map((option) => (
            <option key={option.address} value={option.address}>
              {option.label} ({option.address.slice(0, 4)}...{option.address.slice(-4)})
            </option>
          ))}
        </select>
        {selectedToWallet && (
          <p className="mb-4 break-all rounded-xl border border-theme bg-primary px-3 py-2 text-xs text-muted">
            Receiving wallet: {selectedToWallet}
          </p>
        )}

        <label className="mb-2 block text-xs text-muted">Amount (SOL)</label>
        <input
          className="mb-4 w-full rounded-2xl border border-theme bg-primary px-4 py-3 text-lg font-medium text-secondary outline-none ring-theme focus:ring-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />

        <button
          type="button"
          onClick={() => setPrivateMode(!privateMode)}
          className={`mb-4 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
            privateMode
              ? 'border-accent2/50 bg-accent2/10 text-white'
              : 'border-theme bg-primary text-secondary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy mode (Cloak)
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${privateMode ? 'bg-accent2 text-white' : 'bg-white/10'}`}
          >
            {privateMode ? 'ON' : 'OFF'}
          </span>
        </button>
        <p className="mb-4 text-xs text-muted">
          When ON, funds route through Cloak&apos;s shielded pool so the on-chain link between sender and recipient
          is broken. Requires a working relayer and mainnet-class setup for production.
        </p>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={run}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-teal-400 py-3.5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {busy ? 'Signing…' : privateMode ? 'Send privately' : 'Send SOL'}
        </button>
      </div>
    </div>
  );
}
