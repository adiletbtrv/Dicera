import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.js';
import { Logo } from '@/components/ui/Logo.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await register(form.email, form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 mb-6 drop-shadow-2xl">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-center mb-1" style={{ color: 'var(--text-primary)' }}>
            Join Dicera
          </h1>
          <p className="mt-2 font-body mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Create your free account to begin</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
              className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input id="username" type="text" value={form.username} onChange={(e) => update('username', e.target.value)}
              className="input" placeholder="adventurer123" minLength={3} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
              className="input" placeholder="••••••••" minLength={8} required />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm Password</label>
            <input id="confirm" type="password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)}
              className="input" placeholder="••••••••" required />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--dragon)' }}>{error}</p>}
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
