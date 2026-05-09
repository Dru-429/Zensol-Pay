import { useState } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import SearchResultsList from '../components/SearchResultsList.jsx';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const q = query.trim();
  const { data, isFetching } = useQuery({
    queryKey: ['searchUsers', q],
    queryFn: () => api.searchUsers(q),
    enabled: Boolean(q),
    staleTime: 10_000,
  });
  const results = data?.results || [];

  return (
    <div className="bg-primary mx-auto min-h-screen max-w-md px-4 pb-6 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-muted hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, @username, pubkey"
            className="w-full rounded-full border border-theme bg-secondary py-2.5 pl-10 pr-4 text-sm text-secondary outline-none ring-theme focus:ring-1"
          />
        </div>
      </header>

      {isFetching && (
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {!isFetching && query.trim() && results.length === 0 && (
        <div className="rounded-2xl border border-theme bg-secondary p-4">
          <p className="text-sm text-secondary">No search id, may be user wasn&apos;t using this app.</p>
          <Link
            to="/search/pubkey"
            className="btn-accent mt-3 inline-flex rounded-full px-4 py-2 text-xs font-semibold"
          >
            Try finding my pub key
          </Link>
        </div>
      )}

      {!isFetching && results.length > 0 && <SearchResultsList results={results} />}

      {!query.trim() && (
        <div className="rounded-2xl border border-theme bg-secondary p-4">
          <p className="text-sm text-muted">Type to search your contacts first, then the whole platform.</p>
          <Link
            to="/search/pubkey"
            className="mt-3 inline-flex rounded-full border border-theme px-4 py-2 text-xs text-secondary"
          >
            Try finding my pub key
          </Link>
        </div>
      )}
    </div>
  );
}
