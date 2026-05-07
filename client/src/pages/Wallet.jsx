import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, QrCode, Send, Wallet as WalletIcon, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  try {
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  } catch {
    return String(n);
  }
}

function fixed(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toFixed(digits);
}

function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function Wallet() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { publicKey } = useWallet();

  const accounts = useMemo(() => {
    const list = [];
    if (publicKey?.toBase58()) list.push({ label: 'Connected wallet', address: publicKey.toBase58() });
    const fromUser = (user?.wallets || []).map((w) => ({
      label: w.label || (w.is_primary ? 'Primary' : 'Wallet'),
      address: w.public_address,
    }));
    for (const w of fromUser) {
      if (!list.find((x) => x.address === w.address)) list.push(w);
    }
    return list;
  }, [publicKey, user?.wallets]);

  const [selected, setSelected] = useState(accounts[0]?.address || '');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [payUrl, setPayUrl] = useState('');

  useEffect(() => {
    if (!selected && accounts[0]?.address) setSelected(accounts[0].address);
  }, [accounts, selected]);

  useEffect(() => {
    const load = async () => {
      if (!selected) {
        setLoading(false);
        setErr('No wallet address found. Connect wallet or add one during registration.');
        setData(null);
        return;
      }
      setLoading(true);
      setErr('');
      try {
        const d = await api.balances(selected);
        setData(d);
      } catch (e) {
        setErr(e.message || 'Could not load balances');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selected]);

  const openReceiveQr = () => {
    if (!selected) return;
    const url = encodeURL({
      recipient: new PublicKey(selected),
      amount: new BigNumber(0),
      label: 'SolPay',
      message: `Pay @${user?.username}`,
    });
    setPayUrl(url.toString());
    setQrOpen(true);
  };

  const tokens = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.tokens) && data.tokens.length > 0) return data.tokens;
    return [];
  }, [data]);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-5">
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => nav(-1)} className="rounded-full p-2 text-slate-400 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Wallet</h1>
      </header>

      <section className="rounded-3xl border border-white/10 bg-card/70 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Account</p>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-1 w-full max-w-[220px] truncate rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm outline-none ring-accent focus:ring-1"
            >
              {accounts.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.label} ({shortAddr(a.address)})
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-3 text-slate-300">
            <WalletIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="text-sm text-slate-400">Loading balances…</p>
          ) : err ? (
            <p className="text-sm text-red-400">{err}</p>
          ) : (
            <p className="text-5xl font-semibold tracking-tight">
              ${money(data?.total_usd)}
            </p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={openReceiveQr}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-surface px-2 py-3 text-xs text-slate-200"
          >
            <QrCode className="h-5 w-5 text-accent" />
            QR
          </button>
          <Link
            to="/"
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-surface px-2 py-3 text-xs text-slate-200"
          >
            <Send className="h-5 w-5 text-slate-200" />
            Send
          </Link>
          <button
            type="button"
            onClick={() => nav('/')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-surface px-2 py-3 text-xs text-slate-200"
          >
            <DollarSign className="h-5 w-5 text-slate-200" />
            Sell
          </button>
          <Link
            to={`/profile/${user?.id}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-surface px-2 py-3 text-xs text-slate-200"
          >
            <WalletIcon className="h-5 w-5 text-slate-200" />
            Card
          </Link>
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500">TOKENS</p>
        <div className="space-y-2">
          {tokens.map((t, idx) => (
            <div key={`${t.symbol || t.mint || idx}`} className="flex items-center justify-between rounded-2xl border border-white/5 bg-card/60 px-3 py-3">
              <div className="flex items-center gap-3">
                {t.logo_url ? (
                  <img
                    src={t.logo_url}
                    alt={t.symbol || t.name || 'Token'}
                    className="h-10 w-10 rounded-full bg-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-300">
                    {(t.symbol || t.name || 'T').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{t.symbol || t.name || 'Token'}</p>
                  <p className="text-xs text-slate-500">{fixed(t.balance, 4)} {t.symbol || ''}</p>
                  <p className="text-[11px] text-slate-600">
                    {t.price_usd != null ? `$${fixed(t.price_usd, 4)}` : 'No price'}{' '}
                    {t.change_24h != null && (
                      <span className={t.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {t.change_24h >= 0 ? '+' : ''}
                        {fixed(t.change_24h, 2)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold">${money(t.value_usd)}</p>
            </div>
          ))}
          {!loading && !err && tokens.length === 0 && (
            <p className="text-sm text-slate-500">No tokens found.</p>
          )}
        </div>
      </section>

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

