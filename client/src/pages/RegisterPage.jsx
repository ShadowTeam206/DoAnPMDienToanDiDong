import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthRedirect from '../hooks/useAuthRedirect';

function RegisterPage() {
  useAuthRedirect(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/register', { username, password });
      setSuccess('Tạo tài khoản thành công, đang chuyển sang đăng nhập...');
      setTimeout(
        () => navigate('/login', { replace: true, state: { username, password } }),
        1200
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-sidebarAlt rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-2 text-center">Create an account</h1>
        <p className="text-sm text-textSecondary mb-8 text-center">
          Join the chat
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
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-textSecondary">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded bg-inputBg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/40 rounded px-3 py-2">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-sm font-semibold py-2 rounded mt-2 disabled:opacity-60"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-xs text-textSecondary text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

