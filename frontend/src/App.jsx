import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sun, Moon, LogOut, ShieldAlert, Store, Star } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import OwnerDashboard from './components/OwnerDashboard';

// Create App Context for Toast & Auth State sharing
const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState('login'); // 'login' | 'register'
  const [toasts, setToasts] = useState([]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync auth state to localStorage
  const loginUser = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    showToast('Success', `Welcome back, ${userData.name}!`, 'success');
  };

  const logoutUser = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setView('login');
    showToast('Success', 'Logged out from system.', 'success');
  };

  // Toast notifier
  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // API Request Helper
  const apiCall = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        // If JWT expired, auto log out
        if (response.status === 403 && data.message.includes('expired')) {
          logoutUser();
        }
        throw new Error(data.message || 'Request failed.');
      }
      return data;
    } catch (err) {
      showToast('Error', err.message, 'error');
      throw err;
    }
  };

  // Get initial character badge for avatar
  const getAvatarChar = (name) => {
    if (!name) return 'U';
    return name.trim().split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <AppContext.Provider value={{ user, token, loginUser, logoutUser, showToast, apiCall, toggleTheme, theme }}>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="glass-nav">
          <div className="logo-section" onClick={() => !user && setView('login')}>
            <Star size={28} className="star-icon active" style={{ color: 'var(--primary)' }} />
            <span>TrustRating</span>
          </div>

          <div className="nav-controls">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user && (
              <>
                <div className="user-profile-badge">
                  <div className="user-avatar">
                    {getAvatarChar(user.name)}
                  </div>
                  <div className="user-name-role">
                    <span className="profile-name" title={user.name}>{user.name}</span>
                    <span className="profile-role">{user.role.replace('_', ' ')}</span>
                  </div>
                </div>

                <button
                  className="logout-btn"
                  onClick={logoutUser}
                  title="Log out from the system"
                  aria-label="Log Out"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Global Toast Alerts Feed */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{t.title}</strong>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{t.message}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Router */}
        <main className="main-content">
          {user ? (
            user.role === 'admin' ? (
              <AdminDashboard />
            ) : user.role === 'store_owner' ? (
              <OwnerDashboard />
            ) : (
              <UserDashboard />
            )
          ) : (
            <div className="auth-wrapper">
              {view === 'login' ? (
                <Login onSwitch={() => setView('register')} />
              ) : (
                <Register onSwitch={() => setView('login')} />
              )}
            </div>
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
}
