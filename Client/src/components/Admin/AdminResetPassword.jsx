// src/pages/AdminResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// import { useAdmin } from '../../context/AdminContext';
import { useAdmin } from '../../context/AdminContext';
import './AdminLogin.css';

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, loading } = useAdmin();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be 8+ characters');

    setError('');
    try {
      await resetPassword(token, password);
      setSuccess('Password changed! You can now log in.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Invalid or expired token');
    }
  };

  // Auto-redirect to admin login after successful reset
  React.useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      // navigate back to admin login
      window.location.href = '/admin/login';
    }, 3000);
    return () => clearTimeout(t);
  }, [success]);

  if (!token) {
    return (
      <div className="admin-login-container mt-5">
        <div className="admin-login-wrapper">
          <div className="admin-login-card">
            <div className="admin-form-section" style={{ gridColumn: '1 / -1' }}>
              <p style={{ color: '#fff', textAlign: 'center' }}>
                Invalid reset link. <Link to="/forgot-passwordAdmin" className="admin-forgot-link">Request a new one</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-logo-section">
            <div className="admin-logo">
              <h1 className="admin-logo-text">ADMIN</h1>
              <div className="admin-logo-subtitle">Set New Password</div>
            </div>
          </div>

          <div className="admin-form-section">
            <h2 className="admin-login-title">Reset Password</h2>

            {error && <div className="admin-alert admin-alert-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
            {success && <div className="admin-alert admin-alert-success"><i className="fas fa-check-circle"></i> {success}</div>}

            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-form-group">
                <label className="admin-form-label"><i className="fas fa-lock"></i> New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-form-control"
                  required
                  disabled={loading}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label"><i className="fas fa-lock"></i> Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="admin-form-control"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className={`admin-login-btn ${loading ? 'admin-btn-loading' : ''}`} disabled={loading}>
                {loading ? <>Sending...</> : <>Update Password</>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/AdminLogin" className="admin-forgot-link">Back to Login</Link>
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

export default AdminResetPassword;