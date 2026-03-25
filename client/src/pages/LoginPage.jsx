import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useAuthRedirect from '../hooks/useAuthRedirect';

function LoginPage() {
  useAuthRedirect(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.username) {
      setUsername(location.state.username);
    }
    if (location.state?.password) {
      setPassword(location.state.password);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const token = res.data.token;
      const user = res.data.user || { username };
      setAuth({ token, user });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-sidebarAlt rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-2 text-center">Welcome back</h1>
        <p className="text-sm text-textSecondary mb-8 text-center">
          Login to your account
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-textSecondary">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded bg-inputBg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-textSecondary">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded bg-inputBg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-sm font-semibold py-2 rounded mt-2 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-xs text-textSecondary text-center">
          Need an account?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

