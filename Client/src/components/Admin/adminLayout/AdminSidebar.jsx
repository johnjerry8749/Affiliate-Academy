import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './adminSidebar.css'
import { ADMIN_MENU_ITEMS, PROFILE_MENU_ITEMS, SIDEBAR_CONFIG } from './adminMenuConfig'
// import {logout} from '../../../context/AdminContext'
import { useAdmin } from '../../../context/AdminContext'

// Main Component
const AdminSidebar = () => {
  const {logout} = useAdmin();
  // State Management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  // Event Handlers
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Helper Functions
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="admin-top-navbar">
        <div className="navbar-left">
          <button
            className="sidebar-toggle d-none d-lg-block"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i className={`bi ${isCollapsed ? 'bi-list' : 'bi-x-lg'}`}></i>
          </button>

          <button
            className="sidebar-toggle d-lg-none"
            onClick={toggleMobileMenu}
          >
            <i className="bi bi-list"></i>
          </button>

          <div className="navbar-brand">
            <span className="brand-text">{SIDEBAR_CONFIG.brandText}</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Search Bar */}
          <div className="search-container d-none d-md-block">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder={SIDEBAR_CONFIG.searchPlaceholder}
              />
            </div>
          </div>

          {/* Admin Profile */}
          <div className="dropdown">
            {/* <button 
              className="profile-picture dropdown-toggle" 
              type="button" 
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img 
                src={SIDEBAR_CONFIG.adminAvatar} 
                alt="Admin Profile"
                className="profile-avatar"
              />
            </button> */}
            <button
              className="btn btn-outline-danger dropdown-toggle d-flex align-items-center"
              type="button"
               // Replace with your logout function
               onClick={logout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
            <ul className="dropdown-menu dropdown-menu-end profile-dropdown">
              {PROFILE_MENU_ITEMS.map((item, index) => (
                item.type === 'header' ? (
                  <li key={index}><h6 className="dropdown-header">{item.title}</h6></li>
                ) : item.title === 'divider' ? (
                  <li key={index}><hr className="dropdown-divider" /></li>
                ) : (
                  <li key={index}>
                    <Link className={`dropdown-item ${item.className || ''}`} to={item.path}>
                      <i className={`${item.icon} me-2`}></i>{item.title}
                    </Link>
                  </li>
                )
              ))}
              <li><hr className="dropdown-divider" /></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="position-fixed w-100 h-100 bg-dark opacity-50 d-lg-none"
          style={{ top: 0, left: 0, zIndex: 1040 }}
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${showMobileMenu ? 'show-mobile' : ''}`}>
        {/* Admin Profile Section */}
        <div className="admin-profile p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <div className="admin-avatar me-3">
              <img
                src={SIDEBAR_CONFIG.adminAvatar}
                alt="Admin"
                className="rounded-circle"
                width="40"
                height="40"
              />
            </div>
            {!isCollapsed && (
              <div className="admin-info">
                <h6 className="text-dark mb-0">{SIDEBAR_CONFIG.adminName}</h6>
                <small style={{ color: '#8b4513' }}>
                  <i className="fas fa-circle me-1" style={{ fontSize: '8px' }}></i>
                  {SIDEBAR_CONFIG.adminStatus}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav flex-grow-1">
          <ul className="nav flex-column p-0">
            {ADMIN_MENU_ITEMS.map((item, index) => (
              <li key={index} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link d-flex align-items-center py-3 px-3 text-decoration-none position-relative ${isActive(item.path) ? 'active' : ''
                    } ${item.title === 'Dashboard' ? 'dashboard-item' : ''}`}
                  data-bs-toggle={item.submenu ? 'collapse' : ''}
                  data-bs-target={item.submenu ? `#submenu-${index}` : ''}
                  title={isCollapsed ? item.title : ''}
                >
                  <i className={`${item.icon} me-3`} style={{ minWidth: '20px' }}></i>
                  {!isCollapsed && (
                    <>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{item.title}</div>
                        <small className="text-muted d-block">{item.description}</small>
                      </div>
                      {item.submenu && (
                        <i className="fas fa-chevron-down ms-2 submenu-arrow"></i>
                      )}
                    </>
                  )}
                  {isActive(item.path) && (
                    <div className="active-indicator position-absolute"></div>
                  )}
                </Link>

                {/* Submenu */}
                {item.submenu && !isCollapsed && (
                  <div className="collapse" id={`submenu-${index}`}>
                    <ul className="nav flex-column ms-4 py-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex} className="nav-item">
                          <Link
                            to={subItem.path}
                            className={`nav-link py-2 px-3 text-decoration-none ${isActive(subItem.path) ? 'active-sub' : ''
                              }`}
                          >
                            <i className="fas fa-circle me-2" style={{ fontSize: '6px' }}></i>
                            <span className="submenu-text">{subItem.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}

export default AdminSidebar