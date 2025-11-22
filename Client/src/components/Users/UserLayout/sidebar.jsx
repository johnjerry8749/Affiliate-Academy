import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthProvider';
import './sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth(); // ✅ access from context

  const toggleSidebar = () => setIsOpen(!isOpen);

  // ✅ Real user data (fallbacks if null)
  const userData = {
    name: profile?.full_name || user?.user_metadata?.full_name || 'Guest User',
    email: profile?.email || user?.email || 'guest@example.com',
    avatar:
      profile?.avatar_url ||
      'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(profile?.full_name || user?.email || 'User'),
    role: profile?.payment_method || 'Affiliate',
  };

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // redirect after logout
    } catch (err) {
      console.error('Logout failed:', err.message);
    }
  };

  // ✅ Updated menu items (Logout uses onClick)
  const menuItems = [
    { title: 'Home', icon: 'bi-house-door', path: '/dashboard' },
    { title: 'Program Access', icon: 'bi-unlock', path: '/dashboard/program-access' },
    { title: 'Profile', icon: 'bi-person-circle', path: '/dashboard/profile' },
    { title: 'Product', icon: 'bi-box-seam', path: '/dashboard/products' },
    { title: 'Real Estate', icon: 'bi-house', path: '/dashboard/Estate' },
    { title: 'Payment', icon: 'bi-credit-card', path: '/dashboard/payment' },
    { title: 'Invite', icon: 'bi-person-plus', path: '/dashboard/invite' },

  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
          <div className="navbar-brand">
            <span className="brand-text">AffiliateAcademy</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Notifications
          <button className="nav-icon-btn">
            <i className="bi bi-bell"></i>
            <span className="notification-badge">3</span>
          </button> */}

          {/* Profile Picture */}
          <div className="profile-picture" title={userData.name}>
            <img src={userData.avatar} alt={userData.name} className="profile-avatar" />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
          {/* User Profile Section */}
          <div className="sidebar-user">
            <img src={userData.avatar} alt={userData.name} className="sidebar-avatar" />
            {isOpen && (
              <div className="sidebar-user-info">
                <h6>{userData.name}</h6>
                <p>{userData.role}</p>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="sidebar-menu">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                title={!isOpen ? item.title : ''}
              >
                <i className={`bi ${item.icon}`}></i>
                {isOpen && <span className="menu-text">{item.title}</span>}
              </Link>
            ))}

            {/* ✅ Logout Button */}
            <button
              onClick={handleLogout}
              className="menu-item"
              title="Logout"
              style={{
                border: 'none ',
                background: 'none',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                // gap: '10px',
                textAlign: 'start',
                cursor: 'pointer',
                marginTop: '1rem',
              }}
            >
              <i className="bi bi-box-arrow-right"></i>
              {isOpen && <span className="menu-text">Logout</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        {isOpen && (
          <div className="sidebar-footer">
            <div className="help-card">
              <i className="bi bi-question-circle"></i>
              <h6>Need Help?</h6>
             <p class="text-muted">Join our Telegram group for support.</p>

              <a href="https://t.me/+j25YB8mBs3kwNDE0"
                target="_blank"
                class="btn btn-success btn-sm px-3">
                Get Help
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;
