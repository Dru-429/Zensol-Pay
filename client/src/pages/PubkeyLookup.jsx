import { useState } from 'react';
import { ArrowLeft, Search, Wallet, User, Activity, Coins, Copy, Check, BookmarkPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

function num(value, digits = 4) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function PubkeyLookupPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    const value = address.trim();
    if (!value) return;
    setSubmitted(value);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      await api.saveContact({
        saved_pubkey: data.address,
        display_name: nickname.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      navigate('/chats');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const {
    data,
    isFetching: loading,
    error: errObj,
  } = useQuery({
    queryKey: ['walletLookup', submitted],
    queryFn: () => api.walletLookup(submitted),
    enabled: Boolean(submitted),
    staleTime: 60_000,
  });
  const error = errObj?.message || '';

  return (
    <div className="bg-surface mx-auto min-h-screen max-w-md px-4 pb-6 pt-4 font-sans selection:bg-accent/20">
      <header className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-secondary-text shadow-sm transition-all hover:bg-surface-strong hover:text-primary-text active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-primary-text">Wallet Explorer</h1>
      </header>

      <form onSubmit={run} className="mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-accent text-secondary-text">
            <Search className="h-5 w-5" />
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search Solana public key..."
            className="w-full rounded-2xl border-2 border-border-color bg-card py-4 pl-12 pr-4 text-[15px] font-medium text-primary-text outline-none transition-all placeholder:text-muted-text focus:border-accent focus:bg-surface focus:shadow-[0_0_0_4px_rgba(0,82,255,0.1)]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-accent text-white px-4 py-2 text-sm font-semibold transition-all hover:bg-accent/90 active:scale-95 opacity-0 group-focus-within:opacity-100"
            disabled={!address.trim()}
          >
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border-soft bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-border-color/50" />
                <div className="h-4 w-24 rounded-full bg-border-color/50" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-border-color/30" />
                <div className="h-3 w-2/3 rounded-full bg-border-color/30" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-semantic-down/20 bg-semantic-down/5 p-4 text-center">
          <p className="text-sm font-medium text-semantic-down">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4 transition-all">
          
          {/* Wallet Address Card */}
          <section className="group relative overflow-hidden rounded-2xl border border-border-color bg-gradient-to-br from-card to-surface p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                <h2 className="text-sm font-semibold text-primary-text">Wallet Address</h2>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-strong p-3">
                <p className="truncate text-sm font-medium text-primary-text">{data.address}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(data.address)}
                  className="rounded-lg bg-surface p-2 text-secondary-text shadow-sm transition-all hover:text-accent active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-semantic-up" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </section>

          {/* Add to Contacts Card */}
          <section className="rounded-2xl border border-border-color bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                <BookmarkPlus className="h-4 w-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-primary-text">Save to Contacts</h2>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter a nickname..."
                className="flex-1 rounded-xl border border-border-color bg-surface py-2.5 px-3 text-sm text-primary-text outline-none transition-all placeholder:text-muted-text focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,82,255,0.1)]"
              />
              <button
                onClick={handleSaveContact}
                disabled={!nickname.trim() || saving}
                className="flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            {/* Balances Card */}
            <section className="col-span-2 sm:col-span-1 rounded-2xl border border-border-color bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent2/10">
                  <Coins className="h-4 w-4 text-accent2" />
                </div>
                <h2 className="text-sm font-semibold text-primary-text">Balances</h2>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-primary-text">
                  {data.total_usd == null ? '—' : `$${num(data.total_usd, 2)}`}
                </p>
                <p className="text-sm font-medium text-secondary-text">{num(data.sol_balance)} SOL</p>
              </div>
            </section>

            {/* Identity Card */}
            <section className="col-span-2 sm:col-span-1 rounded-2xl border border-border-color bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-primary-text">Identity</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">SNS</p>
                  <p className="text-sm font-medium text-primary-text truncate">
                    {data.sns_domains?.length ? data.sns_domains.join(', ') : 'No domain'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Social</p>
                  <p className="text-sm font-medium text-primary-text truncate">
                    {data.socials?.twitter || data.socials?.x || 'Not linked'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Activity Card */}
          <section className="rounded-2xl border border-border-color bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-yellow/10">
                <Activity className="h-4 w-4 text-accent-yellow" />
              </div>
              <h2 className="text-sm font-semibold text-primary-text">Recent Activity</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-text">{data.activity?.lastActiveText || 'Unknown'}</p>
                <p className="text-xs text-secondary-text mt-1">Last Active</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary-text">{num(data.activity?.txCount30d, 0)}</p>
                <p className="text-xs text-secondary-text mt-1">30d TXs</p>
              </div>
            </div>
          </section>

          {/* Top Holdings Card */}
          <section className="rounded-2xl border border-border-color bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary-text">Top Holdings</h2>
              <span className="rounded-full bg-surface-strong px-2.5 py-1 text-[11px] font-semibold text-secondary-text">
                {(data.top_holdings || []).length} Tokens
              </span>
            </div>

            <div className="">
              {(data.top_holdings || []).length === 0 && (
                <p className="text-center text-sm text-secondary-text py-4">No token data available</p>
              )}
              {(data.top_holdings || []).map((token) => (
                <div key={`${token.symbol}-${token.name}`} className="group flex items-center justify-between rounded-xl  p-3 transition-colors hover:bg-surface-strong border-b border-border-color/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-card to-border-soft font-bold text-primary-text text-sm shadow-sm border border-border-soft shrink-0">
                      {(token.symbol || token.name).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary-text group-hover:text-accent transition-colors truncate max-w-[120px]">
                        {token.symbol || token.name}
                      </p>
                      <p className="text-[13px] font-medium text-secondary-text truncate">{num(token.balance)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary-text">
                      {token.value_usd == null ? '—' : `$${num(token.value_usd, 2)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
