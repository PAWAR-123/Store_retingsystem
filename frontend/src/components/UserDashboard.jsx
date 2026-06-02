import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Lock, Check, X, RefreshCw, KeyRound } from 'lucide-react';
import { useApp } from '../App';

export default function UserDashboard() {
  const { apiCall, showToast, user } = useApp();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Password Wizard states
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Hover rating preview map
  const [hoveredStars, setHoveredStars] = useState({}); // { storeId: ratingVal }

  // Fetch stores list (with ratings)
  const fetchStores = async () => {
    setLoading(true);
    try {
      const searchQuery = search ? `?search=${search}` : '';
      const data = await apiCall(`/api/user/stores${searchQuery}`);
      setStores(data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, [search]);

  // Handle rating submission or modification
  const handleRateStore = async (storeId, ratingValue) => {
    try {
      const data = await apiCall('/api/user/ratings', {
        method: 'POST',
        body: JSON.stringify({ storeId, rating: ratingValue })
      });
      showToast('Rating Saved', data.message, 'success');
      // Re-fetch stores to refresh the overall ratings
      fetchStores();
    } catch (err) {}
  };

  // Password Validation flags
  const isPwdLenValid = newPassword.length >= 8 && newPassword.length <= 16;
  const hasPwdUpper = /[A-Z]/.test(newPassword);
  const hasPwdSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordValid = isPwdLenValid && hasPwdUpper && hasPwdSpecial;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setUpdatingPassword(true);
    try {
      const data = await apiCall('/api/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });
      showToast('Password Updated', data.message, 'success');
      setNewPassword('');
    } catch (err) {}
    setUpdatingPassword(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
      
      {/* Stores Listings area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="welcome-title">Registered Stores</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Explore local outlets, evaluate service quality, and submit your ratings.</p>
          </div>
          <div className="search-box" style={{ maxWidth: '300px' }}>
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by Name or Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
            <h3>Searching outlets database...</h3>
          </div>
        ) : stores.length === 0 ? (
          <div className="glass-card empty-state">
            <MapPin className="empty-icon" />
            <h3>No Stores Found</h3>
            <p>We couldn't find any stores matching "{search}". Try another query term!</p>
          </div>
        ) : (
          <div className="store-search-grid">
            {stores.map((store) => {
              const activeUserRating = store.userRating;
              const currentHover = hoveredStars[store.id] || 0;
              const displayRating = currentHover || activeUserRating || 0;

              return (
                <div key={store.id} className="glass-card store-card hover-lift">
                  <h3 className="store-name">{store.name}</h3>
                  
                  <div className="store-detail-row">
                    <MapPin size={16} />
                    <span>{store.address}</span>
                  </div>

                  <div className="store-ratings-display">
                    {/* Overall Rating displaying */}
                    <div className="rating-stat-row">
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Score</span>
                      <span className="overall-stars-pill">
                        <Star size={14} fill="var(--warning)" color="var(--warning)" />
                        {store.overallRating > 0 ? store.overallRating.toFixed(1) : 'No Ratings'}
                      </span>
                    </div>

                    {/* Interactive Ratings widget box */}
                    <div className="rating-interaction-box">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                        {activeUserRating ? 'Modify Your Submitted Rating' : 'Evaluate This Outlet'}
                      </span>

                      <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isActive = starVal <= (currentHover || activeUserRating);
                          return (
                            <Star
                              key={starVal}
                              size={22}
                              className={`star-icon interactive ${isActive ? 'active' : ''}`}
                              onMouseEnter={() => setHoveredStars({ ...hoveredStars, [store.id]: starVal })}
                              onMouseLeave={() => setHoveredStars({ ...hoveredStars, [store.id]: 0 })}
                              onClick={() => handleRateStore(store.id, starVal)}
                              title={`Rate ${starVal} Star${starVal > 1 ? 's' : ''}`}
                            />
                          );
                        })}
                      </div>

                      {activeUserRating && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                          Submitted: {activeUserRating} / 5 Stars
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar: Profile and Password modification wizard */}
      <div>
        <div className="glass-card" style={{ position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-card)' }}>
            <KeyRound size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 700 }}>Security Wizard</h2>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="user-newpwd-input">Modify Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  id="user-newpwd-input"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Enter new security password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              {/* Password update requirements checklist */}
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div className={`validation-hint ${isPwdLenValid ? 'valid' : 'invalid'}`}>
                  {isPwdLenValid ? <Check size={12} /> : <X size={12} />}
                  8 to 16 characters long ({newPassword.length}/16)
                </div>
                <div className={`validation-hint ${hasPwdUpper ? 'valid' : 'invalid'}`}>
                  {hasPwdUpper ? <Check size={12} /> : <X size={12} />}
                  At least one uppercase letter
                </div>
                <div className={`validation-hint ${hasPwdSpecial ? 'valid' : 'invalid'}`}>
                  {hasPwdSpecial ? <Check size={12} /> : <X size={12} />}
                  At least one special symbol (e.g. !)
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={updatingPassword || !isPasswordValid}
              style={{ marginTop: '0.5rem' }}
            >
              <RefreshCw size={16} style={{ animation: updatingPassword ? 'spin 1s linear infinite' : 'none' }} />
              {updatingPassword ? 'Saving Changes...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
