import React, { useState } from 'react';
import './AdminLogin.css';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAdmin();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return setError('Please fill in all fields');
    }

    try {
      await login(formData.email, formData.password);

      // Redirect to the originally requested page or default admin dashboard
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials or not an admin.');
    }
  };

  return (
    <div className="admin-login-container mt-5 ">
      <div className="admin-login-wrapper ">
        <div className="admin-login-card">
          {/* Logo Section */}
          <div className="admin-logo-section">
            <div className="admin-logo">
              <h1 className="admin-logo-text">ADMIN</h1>
              <div className="admin-logo-subtitle">Dashboard Access</div>
            </div>
          </div>

          {/* Login Form */}
          <div className="admin-form-section">
            <h2 className="admin-login-title">Administrator Login</h2>

            {error && (
              <div className="admin-alert admin-alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="admin-form-control"
                  placeholder="Enter your admin email"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="password" className="admin-form-label">
                  <i className="fas fa-lock"></i> Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="admin-form-control"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="admin-form-group admin-form-options">
                <label className="admin-checkbox-container">
                  <input type="checkbox" className="admin-checkbox" />
                  <span className="admin-checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-passwordAdmin" className="admin-forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className={`admin-login-btn ${loading ? 'admin-btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>

            <div className="admin-login-footer">
              <p className="admin-footer-text">
                <i className="fas fa-shield-alt"></i> Secure Admin Access Only
              </p>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="admin-bg-elements">
          <div className="admin-bg-circle admin-bg-circle-1"></div>
          <div className="admin-bg-circle admin-bg-circle-2"></div>
          <div className="admin-bg-circle admin-bg-circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
