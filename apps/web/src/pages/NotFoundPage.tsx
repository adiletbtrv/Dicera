import { Link } from 'react-router-dom';
import { Skull, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Skull className="w-16 h-16 mb-6" style={{ color: 'var(--text-muted)' }} />
      <h1 className="font-heading text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>404</h1>
      <p className="text-lg mb-8 font-body" style={{ color: 'var(--text-secondary)' }}>
        This page has been lost to the Shadow Realm.
      </p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home className="w-4 h-4" /> Return Home
      </Link>
    </div>
  );
}
