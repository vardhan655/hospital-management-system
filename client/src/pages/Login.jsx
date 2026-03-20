import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const demoAccounts = [
  { role: 'Admin', email: 'admin@hospital.com', password: 'admin123' },
  { role: 'Doctor', email: 'sarah.mitchell@hospital.com', password: 'doctor123' },
  { role: 'Staff', email: 'alice.j@hospital.com', password: 'staff123' },
];

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => setForm({ email: acc.email, password: acc.password });

  return (
    <div className="auth-page">
      <div className="auth-bg-circle auth-bg-circle-1" />
      <div className="auth-bg-circle auth-bg-circle-2" />

      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <MdLocalHospital size={32} color="white" />
          </div>
          <h1>MediCare HMS</h1>
          <p>Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="search-bar" style={{ background: 'var(--bg-main)' }}>
              <MdEmail size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="email" name="email" placeholder="Enter your email"
                value={form.email} onChange={handleChange}
                style={{ background: 'transparent' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="search-bar" style={{ background: 'var(--bg-main)' }}>
              <MdLock size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'} name="password"
                placeholder="Enter your password"
                value={form.password} onChange={handleChange}
                style={{ background: 'transparent' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <h4>Demo Accounts (click to fill)</h4>
          {demoAccounts.map(acc => (
            <div key={acc.role} className="demo-cred-row">
              <span>{acc.role}: {acc.email}</span>
              <a onClick={() => fillDemo(acc)}>Use this</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
