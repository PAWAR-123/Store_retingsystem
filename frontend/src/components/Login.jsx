import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useApp } from '../App';

export default function Login({ onSwitch }) {
  const { loginUser, apiCall } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      loginUser(data.user, data.token);
    } catch (err) {
      // Errors are already handled by the app-wide toast mechanism
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="auth-header">
        <div className="auth-logo">⭐</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to manage ratings and view dashboards</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email-input">Email Address</label>
          <div className="input-container">
            <Mail className="input-icon" size={18} />
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="e.g. alexander.romanov@storerating.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password-input">Password</label>
          <div className="input-container">
            <Lock className="input-icon" size={18} />
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="Enter your security password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? </span>
        <button className="auth-link" style={{ background: 'none', border: 'none' }} onClick={onSwitch}>
          Sign up here
        </button>
      </div>
    </div>
  );
}
