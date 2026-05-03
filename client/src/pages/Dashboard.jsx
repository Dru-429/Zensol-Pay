import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  QrCode,
  Wallet,
  LogOut,
  ChevronRight,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState('');
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceErr, setBalanceErr] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [payUrl, setPayUrl] = useState('');

  useEffect(() => {
    api
      .contacts()
      .then((d) => setContacts(d.contacts || []))
      .catch(console.error);
  }, []);

  const recent = useMemo(() => contacts.filter((c) => c.is_recent), [contacts]);

  const onSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const u = await api.resolveUser(query.trim());
      navigate(`/transfer/${u.userId}`);
    } catch {
      setBalanceErr('User not found');
    }
  };

  const openReceiveQr = () => {
    const pk =
      publicKey?.toBase58() ||
      user?.wallets?.find((w) => w.is_primary)?.public_address ||
      user?.wallets?.[0]?.public_address;
    if (!pk) {
      setBalanceErr('Connect wallet or add a primary address');
      return;
    }
    const url = encodeURL({
      recipient: new PublicKey(pk),
      amount: new BigNumber(0),
      label: 'SolPay',
      message: `Pay @${user?.username}`,
    });
    setPayUrl(url.toString());
    setQrOpen(true);
  };

  const checkBalance = async () => {
    const pk =
      publicKey?.toBase58() ||
      user?.wallets?.find((w) => w.is_primary)?.public_address ||
      user?.wallets?.[0]?.public_address;
    if (!pk) {
      setBalanceErr('Connect a wallet or register with a Solana address');
      setBalanceOpen(true);
      return;
    }
    setBalanceErr('');
    setBalanceLoading(true);
    setBalanceOpen(true);
    try {
      const data = await api.balances(pk);
      setBalanceData(data);
    } catch (e) {
      setBalanceErr(e.message || 'Could not load balances');
      setBalanceData(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Hello</p>
            <p className="text-lg font-semibold">
              {user?.profile?.full_name || `@${user?.username}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="rounded-full border border-white/10 bg-card p-2.5 text-slate-300"
              title="Wallet"
            >
              <Wallet className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full border border-white/10 bg-card p-2.5 text-slate-300"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-full border border-white/10 bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-accent focus:ring-1"
              placeholder="Search @username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={openReceiveQr}
            className="rounded-full border border-white/10 bg-card p-2.5"
          >
            <QrCode className="h-5 w-5 text-accent" />
          </button>
          <button type="button" className="rounded-full border border-white/10 bg-card p-2.5">
            <ScanLine className="h-5 w-5 text-slate-400" />
          </button>
        </form>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">Trust {user?.profile?.trust_score ?? '—'}</span>
          {connected && (
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
              Wallet linked
            </span>
          )}
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">Recent</h2>
          <Sparkles className="h-4 w-4 text-accent2" />
        </div>
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
          {recent.length === 0 && (
            <p className="text-sm text-slate-600">No recent contacts — run server seed</p>
          )}
          {recent.map((c) => (
            <Link
              key={c.id}
              to={`/transfer/${c.contact_user_id}`}
              className="flex w-20 shrink-0 flex-col items-center gap-1"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent2/40 to-accent/30 text-lg font-bold text-white">
                {(c.display_name || c.contactUser?.username || '?').slice(0, 1).toUpperCase()}
              </div>
              <span className="max-w-full truncate text-center text-xs text-slate-300">
                @{c.contactUser?.username}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-400">People</h2>
        <div className="space-y-2">
          {contacts.map((c) => (
            <Link
              key={c.id}
              to={`/transfer/${c.contact_user_id}`}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-card/80 px-3 py-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                {(c.display_name || c.contactUser?.username || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.display_name || c.contactUser?.profile?.full_name}</p>
                <p className="truncate text-xs text-slate-500">@{c.contactUser?.username}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
            </Link>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-surface/95 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={checkBalance}
            className="flex-1 rounded-2xl bg-gradient-to-r from-accent2 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent2/20"
          >
            Check balance
          </button>
        </div>
      </div>

      {balanceOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Portfolio (Dune Sim)</h3>
              <button type="button" onClick={() => setBalanceOpen(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            {balanceLoading && <p className="text-sm text-slate-400">Loading…</p>}
            {balanceErr && <p className="text-sm text-red-400">{balanceErr}</p>}
            {balanceData && !balanceLoading && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl bg-surface px-4 py-3">
                  <span className="text-slate-400">SOL</span>
                  <span>
                    {balanceData.sol?.balance?.toFixed?.(4) ?? balanceData.sol?.balance}{' '}
                    <span className="text-slate-500">
                      (${balanceData.sol?.value_usd?.toFixed?.(2) ?? '—'})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between rounded-2xl bg-surface px-4 py-3">
                  <span className="text-slate-400">USDC</span>
                  <span>
                    {balanceData.usdc?.balance?.toFixed?.(2) ?? balanceData.usdc?.balance}{' '}
                    <span className="text-slate-500">
                      (${balanceData.usdc?.value_usd?.toFixed?.(2) ?? '—'})
                    </span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Total USD (tokens Dune priced): ~${balanceData.total_usd?.toFixed?.(2) ?? '—'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {qrOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-card p-6 text-center">
            <h3 className="mb-4 font-semibold">Receive with Solana Pay</h3>
            <div className="mx-auto mb-4 flex justify-center rounded-2xl bg-white p-3">
              <QRCodeSVG value={payUrl} size={200} />
            </div>
            <p className="mb-4 break-all text-xs text-slate-500">{payUrl}</p>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="rounded-full bg-white/10 px-6 py-2 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
