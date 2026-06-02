import React, { useState } from 'react';
import { User, Mail, MapPin, Lock, UserPlus, Check, X } from 'lucide-react';
import { useApp } from '../App';

export default function Register({ onSwitch }) {
  const { apiCall, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Password Validation Flags
  const isLenValid = password.length >= 8 && password.length <= 16;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isLenValid && hasUpper && hasSpecial;

  // Live Name Validation
  const isNameValid = name.length >= 20 && name.length <= 60;
  // Live Address Validation
  const isAddressValid = address.length <= 400;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verify constraints before sending request
    if (!isNameValid) {
      showToast('Validation Error', 'Name must be between 20 and 60 characters.', 'error');
      return;
    }
    if (!isAddressValid) {
      showToast('Validation Error', 'Address cannot exceed 400 characters.', 'error');
      return;
    }
    if (!isPasswordValid) {
      showToast('Validation Error', 'Password does not meet requirements.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, address, password })
      });
      showToast('Account Created', 'Registration successful! Please log in.', 'success');
      onSwitch(); // Go to login
    } catch (err) {
      // API call custom errors are shown by the global notifier
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="auth-header">
        <div className="auth-logo">⭐</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register to submit and manage store ratings</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">
            Full Name 
            <span className={`character-badge ${isNameValid ? 'success' : 'danger'}`}>
              {name.length}/60 (Min 20)
            </span>
          </label>
          <div className="input-container">
            <User className="input-icon" size={18} />
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="e.g. Isabella Francesca Sterling"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={`validation-hint ${isNameValid ? 'valid' : 'invalid'}`}>
            {isNameValid ? <Check size={12} /> : <X size={12} />}
            Name must be between 20 and 60 characters.
          </div>
        </div>

        {/* Email Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email Address</label>
          <div className="input-container">
            <Mail className="input-icon" size={18} />
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="e.g. isabella@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Address Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-address">
            Residential Address
            <span className={`character-badge ${isAddressValid ? 'success' : 'danger'}`}>
              {address.length}/400
            </span>
          </label>
          <div className="input-container">
            <MapPin className="input-icon" size={18} />
            <textarea
              id="register-address"
              className="form-input"
              placeholder="Enter your street, suite, city, state, postal code"
              style={{ minHeight: '80px', paddingTop: '0.65rem', resize: 'vertical' }}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Password</label>
          <div className="input-container">
            <Lock className="input-icon" size={18} />
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Password Dynamic Requirements Checklist */}
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className={`validation-hint ${isLenValid ? 'valid' : 'invalid'}`}>
              {isLenValid ? <Check size={12} /> : <X size={12} />}
              8 to 16 characters long ({password.length}/16)
            </div>
            <div className={`validation-hint ${hasUpper ? 'valid' : 'invalid'}`}>
              {hasUpper ? <Check size={12} /> : <X size={12} />}
              At least one uppercase letter
            </div>
            <div className={`validation-hint ${hasSpecial ? 'valid' : 'invalid'}`}>
              {hasSpecial ? <Check size={12} /> : <X size={12} />}
              At least one special character (e.g. !, @, #, $, %)
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || !isNameValid || !isAddressValid || !isPasswordValid}
        >
          <UserPlus size={18} />
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? </span>
        <button className="auth-link" style={{ background: 'none', border: 'none' }} onClick={onSwitch}>
          Sign in here
        </button>
      </div>
    </div>
  );
}
