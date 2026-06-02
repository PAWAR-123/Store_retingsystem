import React, { useState, useEffect } from 'react';
import { Store, Star, Calendar, MessageSquare, Lock, Check, X, RefreshCw, KeyRound, ArrowUpDown } from 'lucide-react';
import { useApp } from '../App';

export default function OwnerDashboard() {
  const { apiCall, showToast } = useApp();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sorting state for the reviews
  const [sortBy, setSortBy] = useState('date'); // 'userName' | 'userEmail' | 'rating' | 'date'
  const [sortOrder, setSortOrder] = useState('DESC');

  // Password Wizard states
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Fetch dashboard payload
  const fetchDashboardData = async () => {
    try {
      const data = await apiCall('/api/owner/dashboard');
      setDashboardData(data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update password wizard validations
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

  // Handle click on table sorting headers
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Get sorted list of reviews
  const getSortedReviews = () => {
    if (!dashboardData || !dashboardData.usersWhoRated) return [];
    
    return [...dashboardData.usersWhoRated].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
        <h3>Loading your store registry details...</h3>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="glass-card empty-state" style={{ minHeight: '60vh' }}>
        <Store className="empty-icon" />
        <h3>Access Authorization Problem</h3>
        <p>We couldn't retrieve any stores assigned to your owner record. Please reach out to system support.</p>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();

  return (
    <div>
      {/* Welcome Title */}
      <div className="admin-header">
        <div>
          <h1 className="welcome-title">{dashboardData.storeName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Store Owner Portal — Overview of customer ratings, feedback logs, and location details.</p>
        </div>
      </div>

      <div className="owner-dashboard-grid">
        
        {/* Left Column: Store overview circular average card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card owner-stat-circle-box hover-lift">
            <div className="rating-ring-wrapper">
              <div style={{ textAlign: 'center' }}>
                <span className="rating-ring-value">
                  {dashboardData.averageRating > 0 ? dashboardData.averageRating.toFixed(1) : 'N/A'}
                </span>
                <span className="rating-ring-label" style={{ display: 'block' }}>Store Avg</span>
              </div>
            </div>
            
            <div className="stars-container" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={20} 
                  fill={star <= Math.round(dashboardData.averageRating) ? "var(--warning)" : "none"} 
                  color={star <= Math.round(dashboardData.averageRating) ? "var(--warning)" : "var(--text-muted)"}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700 }}>
                {dashboardData.totalRatings} Total Review{dashboardData.totalRatings !== 1 ? 's' : ''}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                <Calendar size={12} /> {dashboardData.storeAddress}
              </p>
            </div>
          </div>

          {/* Security and password updates card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-card)' }}>
              <KeyRound size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700 }}>Owner Password Box</h3>
            </div>

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="owner-newpwd-input">Update Password</label>
                <div className="input-container">
                  <Lock className="input-icon" size={16} />
                  <input
                    id="owner-newpwd-input"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Create secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                {/* Requirements check checklist */}
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
              >
                <RefreshCw size={16} style={{ animation: updatingPassword ? 'spin 1s linear infinite' : 'none' }} />
                {updatingPassword ? 'Saving Changes...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: List of ratings/users who evaluated */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <MessageSquare size={22} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 700 }}>Ratings Log Ledger</h2>
          </div>

          {sortedReviews.length === 0 ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <Star className="empty-icon" />
              <h3>No Client Reviews Logged</h3>
              <p>Clients ratings will appear here as soon as they rate your outlet on the main dashboard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Sorting Headers Bar */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-card)', paddingBottom: '0.75rem', paddingRight: '0.5rem' }}>
                <button 
                  className="tab-btn" 
                  style={{ flex: 2, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  onClick={() => handleSort('userName')}
                >
                  Evaluator {sortBy === 'userName' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </button>
                <button 
                  className="tab-btn" 
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  onClick={() => handleSort('rating')}
                >
                  Score {sortBy === 'rating' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </button>
                <button 
                  className="tab-btn" 
                  style={{ flex: 1.5, justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  onClick={() => handleSort('date')}
                >
                  Date {sortBy === 'date' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </button>
              </div>

              {/* Reviews Scrollable list */}
              <div className="review-feed">
                {sortedReviews.map((review) => (
                  <div key={review.userId} className="review-item">
                    <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', flexShrink: 0 }}>
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User and rating detail block */}
                    <div className="review-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 2 }}>
                        <span className="review-username" style={{ display: 'block', wordBreak: 'break-all' }}>{review.userName}</span>
                        <span className="review-email" style={{ display: 'block', wordBreak: 'break-all' }}>{review.userEmail}</span>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <span className="overall-stars-pill" style={{ padding: '0.25rem 0.5rem' }}>
                          <Star size={12} fill="var(--warning)" color="var(--warning)" />
                          <span>{review.rating}</span>
                        </span>
                      </div>

                      <div style={{ flex: 1.5, textAlign: 'right' }}>
                        <span className="review-date" style={{ display: 'block' }}>
                          {new Date(review.date).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="review-date" style={{ display: 'block', opacity: 0.7 }}>
                          {new Date(review.date).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
