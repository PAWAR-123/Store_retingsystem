import React, { useState, useEffect } from 'react';
import { Users, Store, Star, Search, Plus, Filter, Info, X, Check, Eye } from 'lucide-react';
import { useApp } from '../App';

export default function AdminDashboard() {
  const { apiCall, showToast } = useApp();

  // Stats State
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Tab View
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'users'

  // Listings State
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting and Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Detailed User View Modal

  // Form Fields: Add New User
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  // Form Fields: Add New Store
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '' });

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const data = await apiCall('/api/admin/stats');
      setStats(data);
    } catch (err) {}
  };

  // Fetch Stores list
  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/api/admin/stores?sortBy=${sortBy}&order=${sortOrder}`);
      setStores(data);
    } catch (err) {}
    setLoading(false);
  };

  // Fetch Users list
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const roleQuery = roleFilter ? `&filterRole=${roleFilter}` : '';
      const searchQueryParam = searchQuery ? `&filterSearch=${searchQuery}` : '';
      const data = await apiCall(`/api/admin/users?sortBy=${sortBy}&order=${sortOrder}${roleQuery}${searchQueryParam}`);
      setUsers(data);
    } catch (err) {}
    setLoading(false);
  };

  // Fetch listings depending on filters and active tabs
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    } else {
      fetchUsers();
    }
  }, [activeTab, sortBy, sortOrder, roleFilter, searchQuery]);

  // Handle Header click for sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Create Store Submit
  const handleCreateStore = async (e) => {
    e.preventDefault();

    if (newStore.name.length < 20 || newStore.name.length > 60) {
      showToast('Validation Error', 'Store Name must be between 20 and 60 characters.', 'error');
      return;
    }
    if (newStore.address.length > 400) {
      showToast('Validation Error', 'Store Address cannot exceed 400 characters.', 'error');
      return;
    }

    try {
      const data = await apiCall('/api/admin/stores', {
        method: 'POST',
        body: JSON.stringify(newStore)
      });
      showToast('Store Created', data.message, 'success');
      setIsAddStoreOpen(false);
      setNewStore({ name: '', email: '', address: '' });
      fetchStats();
      fetchStores();
    } catch (err) {}
  };

  // Password checker helpers for "Add User" form validation HUD
  const isPwdLenValid = newUser.password.length >= 8 && newUser.password.length <= 16;
  const hasPwdUpper = /[A-Z]/.test(newUser.password);
  const hasPwdSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newUser.password);
  const isNewUserPasswordValid = isPwdLenValid && hasPwdUpper && hasPwdSpecial;

  // Create User Submit
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (newUser.name.length < 20 || newUser.name.length > 60) {
      showToast('Validation Error', 'Name must be between 20 and 60 characters.', 'error');
      return;
    }
    if (newUser.address.length > 400) {
      showToast('Validation Error', 'Address cannot exceed 400 characters.', 'error');
      return;
    }
    if (!isNewUserPasswordValid) {
      showToast('Validation Error', 'Password does not meet requirements.', 'error');
      return;
    }

    try {
      const data = await apiCall('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      showToast('User Created', data.message, 'success');
      setIsAddUserOpen(false);
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
      fetchStats();
      fetchUsers();
    } catch (err) {}
  };

  // Search filter for Client-side Stores filtering (or searches in general)
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Title Header */}
      <div className="admin-header">
        <div>
          <h1 className="welcome-title">Administrator Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Oversee global store ratings, users registry, and server metrics.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-secondary" onClick={() => setIsAddStoreOpen(true)}>
            <Plus size={18} />
            Add Store
          </button>
          <button className="btn-primary" onClick={() => setIsAddUserOpen(true)}>
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Counter Glass Cards Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card hover-lift">
          <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="glass-card stat-card hover-lift">
          <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
            <Store size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalStores}</span>
            <span className="stat-label">Registered Stores</span>
          </div>
        </div>

        <div className="glass-card stat-card hover-lift">
          <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Star size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalRatings}</span>
            <span className="stat-label">Submitted Ratings</span>
          </div>
        </div>
      </div>

      {/* Interactive Listings Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        
        {/* Controls and Filtering Bar */}
        <div className="controls-bar">
          <div className="search-filter-wrapper">
            <div className="search-box">
              <Search className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder={activeTab === 'stores' ? "Search stores by Name, Email, Address..." : "Search users by Name, Email, Address..."}
                style={{ paddingLeft: '2.5rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === 'users' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                <select 
                  className="filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="user">Normal User</option>
                  <option value="store_owner">Store Owner</option>
                </select>
              </div>
            )}
          </div>

          <div className="dashboard-toggle-tabs">
            <button 
              className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
              onClick={() => { setActiveTab('stores'); setSortBy('name'); setSearchQuery(''); }}
            >
              Stores Registry
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSortBy('name'); setSearchQuery(''); }}
            >
              Users Registry
            </button>
          </div>
        </div>

        {/* Listings Tables */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
            <h3>Loading database assets...</h3>
          </div>
        ) : activeTab === 'stores' ? (
          /* ======================================================
             STORES REGISTRY LIST
             ====================================================== */
          filteredStores.length === 0 ? (
            <div className="empty-state">
              <Store className="empty-icon" />
              <h3>No Stores Found</h3>
              <p>Try refining your search keyword or create a brand new store.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Store Name
                      <span className="sort-indicator">{sortBy === 'name' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('email')}>
                      Owner Email
                      <span className="sort-indicator">{sortBy === 'email' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('address')}>
                      Physical Address
                      <span className="sort-indicator">{sortBy === 'address' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('rating')} style={{ textAlign: 'center' }}>
                      Overall Rating
                      <span className="sort-indicator">{sortBy === 'rating' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map(store => (
                    <tr key={store.id}>
                      <td style={{ fontWeight: 600 }}>{store.name}</td>
                      <td>{store.email}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={store.address}>
                        {store.address}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span className="overall-stars-pill">
                            <Star size={14} fill="var(--warning)" color="var(--warning)" />
                            {store.rating > 0 ? store.rating.toFixed(1) : 'No Ratings'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ======================================================
             USERS REGISTRY LIST
             ====================================================== */
          users.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <h3>No Users Found</h3>
              <p>Ensure selection filters or search strings match existing users.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      User Name
                      <span className="sort-indicator">{sortBy === 'name' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('email')}>
                      Email Address
                      <span className="sort-indicator">{sortBy === 'email' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('address')}>
                      Address
                      <span className="sort-indicator">{sortBy === 'address' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th onClick={() => handleSort('role')}>
                      Role
                      <span className="sort-indicator">{sortBy === 'role' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}</span>
                    </th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.address}>
                        {u.address}
                      </td>
                      <td>
                        <span className={`badge ${u.role}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button 
                            className="theme-toggle-btn" 
                            style={{ padding: '0.35rem 0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                            onClick={() => setSelectedUser(u)}
                            title="Inspect User Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ====================================================================
         MODAL OVERLAY: ADD STORE
         ==================================================================== */}
      {isAddStoreOpen && (
        <div className="modal-overlay" onClick={() => setIsAddStoreOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAddStoreOpen(false)} aria-label="Close modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Register New Store</h2>

            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label className="form-label" htmlFor="store-name-input">
                  Store Name
                  <span className={`character-badge ${newStore.name.length >= 20 && newStore.name.length <= 60 ? 'success' : 'danger'}`}>
                    {newStore.name.length}/60 (Min 20)
                  </span>
                </label>
                <input
                  id="store-name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Imperial Culinary Arts Patisserie"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="store-email-input">Store Account Email (Used for Owner login)</label>
                <input
                  id="store-email-input"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. contact@imperialculinary.com"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="store-address-input">
                  Physical Address
                  <span className={`character-badge ${newStore.address.length <= 400 ? 'success' : 'danger'}`}>
                    {newStore.address.length}/400
                  </span>
                </label>
                <textarea
                  id="store-address-input"
                  className="form-input"
                  style={{ minHeight: '80px', padding: '0.75rem 1rem', resize: 'vertical' }}
                  placeholder="e.g. 500 Royal Boulevard, Suite B, London, UK"
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setIsAddStoreOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Create Store</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         MODAL OVERLAY: ADD USER
         ==================================================================== */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAddUserOpen(false)} aria-label="Close modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Create User Account</h2>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="newuser-name-input">
                  Full Name
                  <span className={`character-badge ${newUser.name.length >= 20 && newUser.name.length <= 60 ? 'success' : 'danger'}`}>
                    {newUser.name.length}/60 (Min 20)
                  </span>
                </label>
                <input
                  id="newuser-name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Alexander Maximilian Romanov"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newuser-email-input">Email Address</label>
                  <input
                    id="newuser-email-input"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="e.g. alexander@storerating.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newuser-role-select">Access Role</label>
                  <select
                    id="newuser-role-select"
                    className="filter-select"
                    style={{ width: '100%', padding: '0.75rem' }}
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    required
                  >
                    <option value="user">Normal User</option>
                    <option value="admin">Administrator</option>
                    <option value="store_owner">Store Owner</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newuser-password-input">Security Password</label>
                <input
                  id="newuser-password-input"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Temporary123!"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
                
                {/* User password checklists */}
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className={`validation-hint ${isPwdLenValid ? 'valid' : 'invalid'}`}>
                    {isPwdLenValid ? <Check size={12} /> : <X size={12} />}
                    8 to 16 characters long ({newUser.password.length}/16)
                  </div>
                  <div className={`validation-hint ${hasPwdUpper ? 'valid' : 'invalid'}`}>
                    {hasPwdUpper ? <Check size={12} /> : <X size={12} />}
                    At least one uppercase letter
                  </div>
                  <div className={`validation-hint ${hasPwdSpecial ? 'valid' : 'invalid'}`}>
                    {hasPwdSpecial ? <Check size={12} /> : <X size={12} />}
                    At least one special character (e.g. !)
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newuser-address-input">
                  Home/Company Address
                  <span className={`character-badge ${newUser.address.length <= 400 ? 'success' : 'danger'}`}>
                    {newUser.address.length}/400
                  </span>
                </label>
                <textarea
                  id="newuser-address-input"
                  className="form-input"
                  style={{ minHeight: '80px', padding: '0.75rem 1rem', resize: 'vertical' }}
                  placeholder="e.g. 742 Evergreen Terrace, Springfield, OR"
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: 'auto' }}
                  disabled={newUser.name.length < 20 || newUser.name.length > 60 || newUser.address.length > 400 || !isNewUserPasswordValid}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         MODAL OVERLAY: DETAILED USER INSPECTION (Store owner rating display!)
         ==================================================================== */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedUser(null)} aria-label="Close modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Inspect User Record</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '1rem' }}>
                <div className="user-avatar" style={{ width: '50px', height: '50px', fontSize: '1.25rem' }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', fontWeight: 700 }}>{selectedUser.name}</h3>
                  <span className={`badge ${selectedUser.role}`} style={{ marginTop: '0.25rem' }}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                  <span style={{ fontWeight: 500 }}>{selectedUser.email}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>User ID Code</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>#USR-{selectedUser.id.toString().padStart(4, '0')}</span>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Home / Office Address</span>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{selectedUser.address}</p>
              </div>

              {/* Special condition: If user is Store Owner, display store rating! */}
              {selectedUser.role === 'store_owner' && (
                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Managed Store Details
                  </span>
                  {selectedUser.storeName ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{selectedUser.storeName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Owned Assets Registry</span>
                      </div>
                      <div className="overall-stars-pill" style={{ padding: '0.35rem 0.75rem' }}>
                        <Star size={16} fill="var(--warning)" color="var(--warning)" />
                        <span style={{ fontSize: '1.05rem' }}>{selectedUser.rating > 0 ? selectedUser.rating.toFixed(2) : 'No Ratings'}</span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No store currently assigned to this owner account.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem' }}>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setSelectedUser(null)}>
                Dismiss Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
