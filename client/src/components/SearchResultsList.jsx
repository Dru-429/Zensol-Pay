import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../lib/api.js';

function PersonRow({ item }) {
  const name = item.display_name || item.full_name || `@${item.username}`;
  const subtitle = item.public_address || `@${item.username}`;
  return (
    <Link
      to={`/profile/${item.userId}`}
      className="flex items-center gap-3 rounded-2xl border border-border-soft bg-card px-3 py-3 hover:bg-surface-strong transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft overflow-hidden bg-surface-strong">
        <img 
          src={item.avatar_url || DEFAULT_AVATAR} 
          alt="" 
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary-text">{name}</p>
        <p className="truncate text-xs text-secondary-text">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-text" />
    </Link>
  );
}

export default function SearchResultsList({ results }) {
  const contacts = results.filter((r) => r.source === 'contact');
  const global = results.filter((r) => r.source !== 'contact');

  return (
    <div className="space-y-5">
      {contacts.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-secondary-text">Recent / Contacts</h3>
          <div className="space-y-2">
            {contacts.map((item) => (
              <PersonRow key={`c-${item.userId}`} item={item} />
            ))}
          </div>
        </section>
      )}
      {global.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-secondary-text">All people on SolPay</h3>
          <div className="space-y-2">
            {global.map((item) => (
              <PersonRow key={`g-${item.userId}`} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
