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
    <div className="bg-surface mx-auto min-h-screen max-w-md px-4 pb-6 pt-4">
      <header className="mb-4 flex items-center gap-3 mb-2 border-b-2 border-border pb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-secondary-text hover:bg-surface-strong"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, @username, pubkey"
            className="w-full rounded-full border border-border-color bg-card py-2.5 pl-10 pr-4 text-sm text-primary-text outline-none ring-accent focus:ring-1"
          />
        </div>
      </header>

      {isFetching && (
        <div className="mb-3 flex items-center gap-2 text-sm text-secondary-text">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {!isFetching && query.trim() && results.length === 0 && (
        <div className="rounded-2xl border border-border-color bg-card p-4 text-center mt-20">
          <p className="text-sm text-secondary-text">No search id, may be user wasn&apos;t using this app.</p>
          <Link
            to="/search/pubkey"
            className="mt-3 inline-flex rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            Try finding my pub key
          </Link>
        </div>
      )}

      {!isFetching && results.length > 0 && <SearchResultsList results={results} />}

      {!query.trim() && (
        <Link
          to="/search/pubkey"
          className="rounded-full border border-border-color bg-surface px-4 py-2 text-xs text-secondary-text hover:bg-surface-strong transition-colors"
        >
          Try finding my pub key
        </Link>
      )}
    </div>
  );
}
