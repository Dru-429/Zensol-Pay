import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function PersonRow({ item }) {
  const name = item.display_name || item.full_name || `@${item.username}`;
  const subtitle = item.public_address || `@${item.username}`;
  return (
    <Link
      to={`/profile/${item.userId}`}
      className="flex items-center gap-3 rounded-2xl border border-theme-soft bg-secondary-soft px-3 py-3"
    >
      <div className="avatar-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
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
          <h3 className="mb-2 text-sm font-medium text-muted">Recent / Contacts</h3>
          <div className="space-y-2">
            {contacts.map((item) => (
              <PersonRow key={`c-${item.userId}`} item={item} />
            ))}
          </div>
        </section>
      )}
      {global.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted">All people on SolPay</h3>
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
