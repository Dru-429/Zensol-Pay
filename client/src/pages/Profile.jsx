import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MoveDownIcon, Pencil, Save, Send } from 'lucide-react';
import { FiLink, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { api, DEFAULT_AVATAR } from '../lib/api.js';

function shortAddress(address) {
  if (!address) return 'No wallet linked';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeUrl(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('@')) return `https://x.com/${trimmed.slice(1)}`;
  return `https://${trimmed}`;
}

function linkMeta(raw) {
  const value = raw.trim();
  const url = normalizeUrl(value);
  const lower = url.toLowerCase();
  const xHandleMatch = url.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
  const resolvedXHandle = xHandleMatch?.[1] ? `@${xHandleMatch[1]}` : null;

  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { url, label: value.startsWith('@') ? value : resolvedXHandle || '@handle', Icon: FiTwitter };
  }

  if (lower.includes('linkedin.com') || lower.startsWith('https://in/')) {
    return { url, label: value, Icon: FiLinkedin };
  }

  return { url, label: value, Icon: FiLink };
}

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const isOwner = user?.id === id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    link1: '',
    link2: '',
    link3: '',
  });

  const {
    data: profileUser,
    isLoading: loading,
    error: profileErr,
  } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: () => api.userProfile(id),
  });

  const { data: historyData } = useQuery({
    queryKey: ['myTransfers'],
    queryFn: api.myTransfers,
    enabled: Boolean(isOwner),
    staleTime: 10_000,
  });
  const history = historyData?.transfers || [];

  useEffect(() => {
    if (!profileUser) return;
    const links = profileUser?.profile?.links || [];
    setForm({
      full_name: profileUser?.profile?.full_name || '',
      bio: profileUser?.profile?.bio || '',
      link1: links[0] || '',
      link2: links[1] || '',
      link3: links[2] || '',
    });
  }, [profileUser]);

  useEffect(() => {
    if (profileErr) setError(profileErr.message || 'Failed to load profile');
  }, [profileErr]);

  const primaryWallet = useMemo(
    () =>
      profileUser?.wallets?.find((wallet) => wallet.is_primary)?.public_address ||
      profileUser?.wallets?.[0]?.public_address,
    [profileUser]
  );

  const primaryWalletId = useMemo(
    () =>
      profileUser?.wallets?.find((wallet) => wallet.is_primary)?.id ||
      profileUser?.wallets?.[0]?.id ||
      '',
    [profileUser]
  );

  const links = useMemo(() => {
    if (!profileUser?.profile?.links?.length) return [];
    return profileUser.profile.links.filter(Boolean).slice(0, 3);
  }, [profileUser]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.updateUserProfile(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditing(false);
    },
    onError: (e) => setError(e.message || 'Failed to save profile'),
  });

  const primaryMutation = useMutation({
    mutationFn: (walletId) => api.setPrimaryWallet(id, walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e) => setError(e.message || 'Failed to set primary wallet'),
  });

  const onSave = async () => {
    setError('');
    const payload = {
      full_name: form.full_name.trim(),
      bio: form.bio.trim(),
      links: [form.link1, form.link2, form.link3].map((item) => item.trim()).filter(Boolean),
    };
    saveMutation.mutate(payload);
  };

  if (loading) {
    return <div className="mx-auto min-h-screen max-w-md px-4 py-8 text-secondary-text bg-surface">Loading profile...</div>;
  }

  if (!profileUser) {
    return <div className="mx-auto min-h-screen max-w-md px-4 py-8 text-semantic-down bg-surface">{error || 'Profile not found'}</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-5 pb-24 bg-surface">
      <header className="mb-4 flex items-center gap-3">
        <Link to="/" className="rounded-full p-2 text-secondary-text hover:bg-surface-strong">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-primary-text">Profile</h1>
      </header>

      <section className="rounded-3xl border border-border-color bg-card p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border-soft overflow-hidden bg-surface-strong">
            <img 
              src={profileUser.profile?.avatar_url || DEFAULT_AVATAR} 
              alt="" 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-primary-text">{profileUser.profile?.full_name || `@${profileUser.username}`}</p>
            <p className="truncate text-sm text-secondary-text">@{profileUser.username}</p>
            <p className="mt-1 text-xs text-secondary-text">Public key: {shortAddress(primaryWallet)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-secondary-text">{profileUser.profile?.bio || 'No whereabouts added yet.'}</p>
          {(links.length > 0 || editing) && (
            <div className="space-y-1">
              {editing ? (
                <>
                  <input
                    className="w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm text-primary-text outline-none ring-accent focus:ring-1"
                    placeholder="Link 1"
                    value={form.link1}
                    onChange={(e) => setForm((prev) => ({ ...prev, link1: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm text-primary-text outline-none ring-accent focus:ring-1"
                    placeholder="Link 2"
                    value={form.link2}
                    onChange={(e) => setForm((prev) => ({ ...prev, link2: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm text-primary-text outline-none ring-accent focus:ring-1"
                    placeholder="Link 3"
                    value={form.link3}
                    onChange={(e) => setForm((prev) => ({ ...prev, link3: e.target.value }))}
                  />
                </>
              ) : (
                links.map((entry) => {
                  const { url, label, Icon } = linkMeta(entry);
                  return (
                    <a
                      key={entry}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary-text hover:text-accent transition-colors"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-strong text-xs text-secondary-text">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{label}</span>
                    </a>
                  );
                })
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="mt-4 space-y-2">
            {editing && (
              <>
                <input
                  className="w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm text-primary-text outline-none ring-accent focus:ring-1"
                  placeholder="Display name"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                />
                <textarea
                  className="min-h-24 w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm text-primary-text outline-none ring-accent focus:ring-1"
                  placeholder="Bio..."
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </>
            )}
            <div className="flex gap-2">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-xl border border-border-color bg-surface px-3 py-2 text-sm font-medium text-primary-text hover:bg-surface-strong transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit profile / links
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saveMutation.isPending}
                  className="bg-accent flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? 'Saving...' : 'Save profile'}
                  </span>
                </button>
              )}
              <Link
                to={`/transfer/${id}`}
                className="rounded-xl border border-border-color bg-surface px-3 py-2 text-sm font-medium text-primary-text hover:bg-surface-strong transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Message
                </span>
              </Link>
            </div>

            <div className="mt-3">
              <select
                value={primaryWalletId}
                onChange={(e) => {
                  setError('');
                  primaryMutation.mutate(e.target.value);
                }}
                disabled={primaryMutation.isPending}
                className={"w-full rounded-xl border border-border-color bg-surface px-3 py-2 text-sm font-medium text-primary-text outline-none hover:bg-surface-strong transition-colors text-center"}
              >
                <option value="" disabled>Select primary wallet</option>
                {profileUser?.wallets?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label || 'Wallet'} ({shortAddress(w.public_address)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isOwner && (
          <div className="mt-4">
            <Link
              to={`/transfer/${id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <Send className="h-4 w-4" />
              Message
            </Link>
          </div>
        )}
      </section>

      {isOwner && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-secondary-text">Transaction history</h2>
          </div>
          <div className="space-y-1">
            {history.length === 0 && <p className="text-sm text-secondary-text">No transactions yet.</p>}
            {history.map((tx) => {
              const incoming = tx.receiver_id === user?.id;
              const other = incoming ? tx.sender?.username : tx.receiver?.username;
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-border-soft bg-card px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-primary-text">{incoming ? `From @${other}` : `To @${other}`}</p>
                    <p className="text-xs text-secondary-text">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-semibold ${incoming ? 'text-semantic-up' : 'text-secondary-text'}`}>
                    {incoming ? '+' : '-'}{tx.amount_ui} SOL
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && <p className="mt-3 text-sm text-semantic-down">{error}</p>}
    </div>
  );
}
