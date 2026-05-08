import { useState } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

function num(value, digits = 4) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function PubkeyLookupPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const run = async (e) => {
    e.preventDefault();
    const value = address.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.walletLookup(value);
      setData(res);
    } catch (ex) {
      setData(null);
      setError(ex.message || 'Failed to fetch public key data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-surface px-4 pb-6 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-slate-400 hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Find by public key</h1>
      </header>

      <form onSubmit={run} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Paste Solana public key"
            className="w-full rounded-2xl border border-white/10 bg-card py-3 pl-10 pr-4 text-sm outline-none ring-accent focus:ring-1"
          />
        </div>
      </form>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching wallet details...
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {data && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="text-xs text-slate-500">Wallet</p>
            <p className="mt-1 break-all text-sm text-slate-200">{data.address}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="text-sm font-medium">Identity</p>
            <p className="mt-2 text-xs text-slate-400">
              SNS: {data.sns_domains?.length ? data.sns_domains.join(', ') : 'No SNS domain found'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              X: {data.socials?.twitter || data.socials?.x || 'Not linked'}
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="text-sm font-medium">Activity</p>
            <p className="mt-2 text-xs text-slate-400">{data.activity?.lastActiveText || 'Unknown'}</p>
            <p className="mt-1 text-xs text-slate-400">
              {num(data.activity?.txCount30d, 0)} transactions in last 30 days
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="text-sm font-medium">Balances</p>
            <p className="mt-2 text-xs text-slate-400">SOL: {num(data.sol_balance)} SOL</p>
            <p className="mt-1 text-xs text-slate-400">
              Portfolio value: {data.total_usd == null ? '—' : `$${num(data.total_usd, 2)}`}
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="mb-2 text-sm font-medium">Top Holdings</p>
            <div className="space-y-2">
              {(data.top_holdings || []).length === 0 && <p className="text-xs text-slate-500">No token data</p>}
              {(data.top_holdings || []).map((token) => (
                <div key={`${token.symbol}-${token.name}`} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-200">{token.symbol || token.name}</p>
                    <p className="text-slate-500">{num(token.balance)}</p>
                  </div>
                  <p className="text-slate-300">
                    {token.value_usd == null ? '—' : `$${num(token.value_usd, 2)}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
