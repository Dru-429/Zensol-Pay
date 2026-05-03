import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Shield, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { sendSolTransfer } from '../lib/solTransfer.js';

export default function PrivatePaymentSheet({
  open,
  onClose,
  peerId,
  recipientPubkey,
  onComplete,
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState('0.01');
  const [privateMode, setPrivateMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const run = async () => {
    setError('');
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError('Connect a Solana wallet first');
      return;
    }
    if (!recipientPubkey) {
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
          recipientAddress: recipientPubkey,
        });
        txHash = signature;
        isPrivate = true;
      } else {
        txHash = await sendSolTransfer({
          connection,
          fromPubkey: wallet.publicKey,
          sendTransaction: wallet.sendTransaction,
          toAddress: recipientPubkey,
          amountSol: amt,
        });
      }

      const summary = await api.balances(wallet.publicKey.toBase58()).catch(() => null);
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
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pay</h3>
          <button type="button" onClick={onClose} className="text-slate-500">
            ✕
          </button>
        </div>

        <label className="mb-2 block text-xs text-slate-500">Amount (SOL)</label>
        <input
          className="mb-4 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-lg font-medium outline-none ring-accent focus:ring-1"
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
              : 'border-white/10 bg-surface text-slate-300'
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
        <p className="mb-4 text-xs text-slate-500">
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
