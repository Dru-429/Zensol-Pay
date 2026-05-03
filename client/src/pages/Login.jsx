import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  if (user) {
    nav('/', { replace: true });
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      nav('/', { replace: true });
    } catch (ex) {
      setErr(ex.message || 'Login failed');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">SolPay</h1>
      <p className="mb-8 text-sm text-slate-400">Sign in with your account</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Email</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm outline-none ring-accent focus:ring-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Password</label>
          <input
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm outline-none ring-accent focus:ring-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-accent to-emerald-400 py-3.5 text-sm font-semibold text-surface"
        >
          Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="text-accent">
          Register
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-slate-600">
        Demo: alice@solpay.demo / demo1234
      </p>
    </div>
  );
}
