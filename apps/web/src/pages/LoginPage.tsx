import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.js';
import { Swords } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 flex flex-col items-center">
          <div
            className="p-4 rounded-full mb-6 flex items-center justify-center"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
          >
            <Swords className="w-10 h-10" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>
            Dicera
          </h1>
          <p className="mt-2 font-body" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input" placeholder="••••••••" required />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--dragon)' }}>{error}</p>}
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
