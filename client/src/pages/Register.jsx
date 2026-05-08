import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, user } = useAuth();
  const { publicKey } = useWallet();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [full_name, setFullName] = useState('');
  const [err, setErr] = useState('');

  if (user) {
    nav('/', { replace: true });
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await register({
        email,
        username: username.replace(/^@/, ''),
        password,
        full_name,
        public_address: publicKey?.toBase58(),
      });
      nav('/', { replace: true });
    } catch (ex) {
      setErr(ex.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Create account</h1>
      <p className="mb-8 text-sm text-muted">Link a @username to your Solana wallet</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Email</label>
          <input
            className="w-full rounded-2xl border border-theme bg-secondary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">@username</label>
          <input
            className="w-full rounded-2xl border border-theme bg-secondary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Display name</label>
          <input
            className="w-full rounded-2xl border border-theme bg-secondary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Password</label>
          <input
            type="password"
            className="w-full rounded-2xl border border-theme bg-secondary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <p className="text-xs text-muted">
          Connected wallet:{' '}
          <span className="text-secondary">{publicKey ? publicKey.toBase58().slice(0, 8) + '…' : 'none'}</span>{' '}
          (optional — adds primary address)
        </p>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-accent2 to-fuchsia-500 py-3.5 text-sm font-semibold text-white"
        >
          Sign up
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Have an account?{' '}
        <Link to="/login" className="text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
