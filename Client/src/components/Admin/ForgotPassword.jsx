import React, { useState } from 'react';
import './AdminLogin.css';
import { Link } from 'react-router-dom';
// import { useAdmin } from '../../context/AdminContext';
import { useAdmin } from '../../context/AdminContext';

const AdminForgotPassword = () => {
  const { resetPasswordRequest, loading } = useAdmin();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');

    setError('');
    setSuccess('');
    try {
      await resetPasswordRequest(email);
      setSuccess('Check your email for the reset link.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="admin-login-container my-5">
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          {/* Logo */}
          <div className="admin-logo-section">
            <div className="admin-logo">
              <h1 className="admin-logo-text">ADMIN</h1>
              <div className="admin-logo-subtitle">Password Recovery</div>
            </div>
          </div>

          {/* Form */}
          <div className="admin-form-section">
            <h2 className="admin-login-title">Forgot Password?</h2>

            {error && (
              <div className="admin-alert admin-alert-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            {success && (
              <div className="admin-alert admin-alert-success">
                <i className="fas fa-check-circle"></i> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-form-group">
                <label htmlFor="email" className="admin-form-label">
                  <i className="fas fa-envelope"></i> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-form-control"
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={`admin-login-btn ${loading ? 'admin-btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Send Reset Link
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/admin/login" className="admin-forgot-link">
                <i className="fas fa-arrow-left"></i> Back to Login
              </Link>
            </div>

            <div className="admin-login-footer">
              <p className="admin-footer-text">
                <i className="fas fa-shield-alt"></i> Secure Admin Access Only
              </p>
            </div>
          </div>
        </div>

        <div className="admin-bg-elements">
          <div className="admin-bg-circle admin-bg-circle-1"></div>
          <div className="admin-bg-circle admin-bg-circle-2"></div>
          <div className="admin-bg-circle admin-bg-circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;