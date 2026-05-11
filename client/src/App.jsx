import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transfer from './pages/Transfer.jsx';
import Profile from './pages/Profile.jsx';
import Wallet from './pages/Wallet.jsx';
import SearchPage from './pages/Search.jsx';
import PubkeyLookupPage from './pages/PubkeyLookup.jsx';
import Navbar from './components/Navbar.jsx';
import Chats from './pages/chats.jsx';
import Landing from './pages/Landing.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }
  return user ? <Dashboard /> : <Landing />;
}

export default function App() {
  return (
    <div className="bg-zinc-950">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={<HomeRoute />}
        />
        <Route
          path="/transfer/:id"
          element={
            <PrivateRoute>
              <Transfer />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <PrivateRoute>
              <Wallet />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/search/pubkey"
          element={
            <PrivateRoute>
              <PubkeyLookupPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <PrivateRoute>
              <Chats />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Navbar />
    </div>
  );
}
