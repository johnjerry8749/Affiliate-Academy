import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';

const ReferalTransactions = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expandedUser, setExpandedUser] = useState(null);
  const usersPerPage = 10;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Live Alert Function
  const showLiveAlert = (message, type = 'success') => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertPlaceholder.append(wrapper);
    setTimeout(() => wrapper.remove(), 5000);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
      }
    };
    checkSidebarState();
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  const fetchUsersWithReferrals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
        search: searchQuery
      });

      const response = await fetch(`${BACKEND_URL}/api/admin/users-referrals?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('Users with referrals:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      setUsers(result.data || []);
      setTotalUsers(result.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      showLiveAlert('Failed to fetch users: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithReferrals();
  }, [currentPage, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'NGN': '₦', 'GHS': '₵', 'KES': 'KSh', 'ZAR': 'R'
    };
    return `${symbols[currency] || '$'}${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleUserExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <>
      <style>
        {`
          .referral-card {
            transition: all 0.3s ease;
            border: 1px solid #e9ecef;
            background-color: #ffffff !important;
          }
          .referral-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .user-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 18px;
            flex-shrink: 0;
          }
          .referral-item {
            border-left: 3px solid #0d6efd;
            transition: all 0.2s ease;
            background-color: #ffffff;
            border: 1px solid #e9ecef;
          }
          .referral-item:hover {
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .commission-badge {
            font-size: 0.8rem;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            white-space: nowrap;
          }
          .expand-btn {
            transition: transform 0.3s ease;
            display: inline-block;
          }
          .expand-btn.expanded {
            transform: rotate(180deg);
          }
          .referral-history {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-in-out;
          }
          .referral-history.show {
            max-height: 3000px;
          }
          .stat-box {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .info-box {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
          }
          .min-width-0 {
            min-width: 0;
          }
          .text-truncate-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Extra Large Screens (1400px+) */
          @media (min-width: 1400px) {
            .user-avatar {
              width: 50px;
              height: 50px;
              font-size: 20px;
            }
            .stat-box {
              padding: 14px 16px;
            }
          }
          
          /* Large Screens (992px - 1199px) */
          @media (max-width: 1199px) {
            .user-avatar {
              width: 42px;
              height: 42px;
              font-size: 17px;
            }
            .stat-box {
              padding: 10px;
            }
          }
          
          /* Medium Screens - Tablets (768px - 991px) */
          @media (max-width: 991px) {
            .user-avatar {
              width: 40px;
              height: 40px;
              font-size: 16px;
            }
            .stat-box {
              padding: 10px 8px;
            }
            .stat-box .fs-4 {
              font-size: 1.25rem !important;
            }
            .stat-box .fs-5 {
              font-size: 1rem !important;
            }
            .stat-box .fs-6 {
              font-size: 0.9rem !important;
            }
            .commission-badge {
              font-size: 0.75rem;
              padding: 0.3rem 0.6rem;
            }
          }
          
          /* Small Screens - Large Phones (576px - 767px) */
          @media (max-width: 767px) {
            .referral-card .card-body {
              padding: 0.875rem;
            }
            .user-avatar {
              width: 38px;
              height: 38px;
              font-size: 14px;
            }
            .stat-box {
              padding: 8px 6px;
            }
            .stat-box small {
              font-size: 0.7rem;
            }
            .info-box {
              padding: 10px;
            }
            .btn-sm {
              font-size: 0.8rem;
              padding: 0.35rem 0.6rem;
            }
            .page-header h2 {
              font-size: 1.25rem;
            }
            .commission-badge {
              font-size: 0.7rem;
              padding: 0.25rem 0.5rem;
            }
          }
          
          /* Extra Small Screens - Small Phones (max 575px) */
          @media (max-width: 575px) {
            .referral-card .card-body {
              padding: 0.75rem;
            }
            .user-info-section h6 {
              font-size: 0.875rem;
            }
            .user-info-section small {
              font-size: 0.7rem;
            }
            .user-avatar {
              width: 36px;
              height: 36px;
              font-size: 13px;
            }
            .stat-box {
              padding: 6px 4px;
            }
            .stat-box small {
              font-size: 0.65rem;
              line-height: 1.2;
            }
            .stat-box .fs-4 {
              font-size: 1rem !important;
            }
            .stat-box .fs-5 {
              font-size: 0.9rem !important;
            }
            .stat-box code {
              font-size: 0.65rem !important;
            }
            .commission-badge {
              font-size: 0.65rem;
              padding: 0.2rem 0.4rem;
            }
            .page-header h2 {
              font-size: 1.1rem;
            }
            .page-header p {
              font-size: 0.75rem;
            }
            .btn-sm {
              font-size: 0.75rem;
              padding: 0.3rem 0.5rem;
            }
            .pagination .page-link {
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
            }
          }
          
          /* Very Small Screens (max 375px) */
          @media (max-width: 375px) {
            .referral-card .card-body {
              padding: 0.625rem;
            }
            .user-avatar {
              width: 32px;
              height: 32px;
              font-size: 12px;
            }
            .stat-box {
              padding: 5px 3px;
            }
            .stat-box small {
              font-size: 0.6rem;
            }
            .stat-box .fs-4, .stat-box .fs-5 {
              font-size: 0.85rem !important;
            }
            .stat-box code {
              font-size: 0.6rem !important;
            }
            .user-info-section h6 {
              font-size: 0.8rem;
            }
            .commission-badge {
              font-size: 0.6rem;
              padding: 0.15rem 0.35rem;
            }
          }
        `}
      </style>

      <div className="admin-layout d-flex">
        <AdminSidebar />
        
        <div 
          id="liveAlertPlaceholder" 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            minWidth: '280px',
            maxWidth: '90vw'
          }}
        ></div>
        
        <div 
          className="main-content flex-grow-1 p-2 p-sm-3 p-md-4"
          style={{
            marginLeft: windowWidth <= 768 ? '0' : (isSidebarCollapsed ? '80px' : '250px'),
            transition: 'margin-left 0.3s ease',
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            overflowX: 'hidden'
          }}
        >
          {/* Header */}
          <div className="mb-3 mb-md-4 mt-4 mt-md-5 page-header">
            <h2 className="mb-1 mb-md-2 fw-bold" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.75rem)' }}>
              <i className="bi bi-people-fill me-2 text-primary"></i>
              <span className="d-none d-sm-inline">User Referrals & Commissions</span>
              <span className="d-sm-none">Referrals</span>
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)' }}>
              <span className="d-none d-md-inline">View registered users with their referrals and commission history</span>
              <span className="d-md-none">Users, referrals & commissions</span>
            </p>
          </div>

          {/* Search */}
          <div className="card mb-3 mb-md-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef' }}>
            <div className="card-body p-2 p-sm-3">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-sm-8 col-md-9">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0" style={{ fontSize: 'inherit' }}>
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder={windowWidth < 576 ? "Search..." : "Search by name, email or referral code..."}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-4 col-md-3">
                  <div className="d-flex align-items-center justify-content-start justify-content-sm-end h-100">
                    <small className="text-muted" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Total: <strong>{totalUsers}</strong> users
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading users and referrals...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="card shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef' }}>
              <div className="card-body text-center py-5">
                <i className="bi bi-people display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No users found</h5>
                <p className="text-muted mb-0">There are no users matching your criteria.</p>
              </div>
            </div>
          ) : (
            <>
              {/* User Cards - Responsive for all screen sizes */}
              <div className="user-cards">
                {users.map((user) => (
                  <div key={user.id} className="card mb-3 shadow-sm referral-card">
                    <div className="card-body">
                      {/* User Info Row - Responsive */}
                      <div className="row align-items-center g-2 g-md-3">
                        {/* User Avatar & Name */}
                        <div className="col-12 col-lg-4">
                          <div className="d-flex align-items-center user-info-section">
                            <div 
                              className="user-avatar me-2 me-md-3"
                              style={{ backgroundColor: `hsl(${user.full_name?.charCodeAt(0) * 10 || 200}, 70%, 50%)` }}
                            >
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <h6 className="mb-0 fw-bold text-dark text-truncate">{user.full_name || 'N/A'}</h6>
                              <small className="text-muted d-block text-truncate">{user.email}</small>
                              <small className="text-muted d-none d-sm-block">
                                <i className="bi bi-calendar me-1"></i>
                                Joined: {formatDate(user.created_at)}
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Stats - Responsive Grid */}
                        <div className="col-12 col-lg-6">
                          <div className="row g-2">
                            {/* Referral Code */}
                            <div className="col-4">
                              <div className="stat-box">
                                <small className="text-muted d-block mb-1">Referral Code</small>
                                <code className="text-primary fw-bold" style={{ fontSize: '0.75rem' }}>
                                  {user.referral_code || 'N/A'}
                                </code>
                              </div>
                            </div>
                            {/* Total Referrals */}
                            <div className="col-4">
                              <div className="stat-box">
                                <small className="text-muted d-block mb-1">Referrals</small>
                                <span className="fs-5 fw-bold text-primary">{user.referral_count || 0}</span>
                              </div>
                            </div>
                            {/* Total Earned */}
                            <div className="col-4">
                              <div className="stat-box">
                                <small className="text-muted d-block mb-1">Earned</small>
                                <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>
                                  {formatCurrency(user.total_commission, user.currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* View Referrals Button */}
                        <div className="col-12 col-lg-2">
                          <button 
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => toggleUserExpand(user.id)}
                            disabled={!user.referrals || user.referrals.length === 0}
                          >
                            <i className={`bi bi-chevron-down expand-btn ${expandedUser === user.id ? 'expanded' : ''}`}></i>
                            <span className="ms-1 d-none d-sm-inline">View</span>
                            <span className="ms-1">({user.referrals?.length || 0})</span>
                          </button>
                        </div>
                      </div>

                      {/* Mobile: Show join date */}
                      <div className="d-sm-none mt-2">
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          Joined: {formatDate(user.created_at)}
                        </small>
                      </div>

                      {/* Referral History (Expandable) */}
                      <div className={`referral-history ${expandedUser === user.id ? 'show' : ''}`}>
                        {user.referrals && user.referrals.length > 0 && (
                          <div className="mt-3 pt-3 border-top">
                            <h6 className="mb-3 text-dark fs-6">
                              <i className="bi bi-clock-history me-2"></i>
                              Referral & Commission History
                            </h6>
                            
                            {/* Desktop Table View */}
                            <div className="table-responsive d-none d-md-block">
                              <table className="table table-sm table-hover mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Referred User</th>
                                    <th>Email</th>
                                    <th>Date Referred</th>
                                    <th>Commission</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.referrals.map((ref, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <div 
                                            className="user-avatar me-2"
                                            style={{ 
                                              width: '28px', 
                                              height: '28px', 
                                              fontSize: '11px',
                                              backgroundColor: `hsl(${ref.full_name?.charCodeAt(0) * 10 || 100}, 60%, 50%)` 
                                            }}
                                          >
                                            {ref.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                          </div>
                                          <span className="text-dark">{ref.full_name || 'N/A'}</span>
                                        </div>
                                      </td>
                                      <td><small className="text-dark">{ref.email}</small></td>
                                      <td><small className="text-dark">{formatDate(ref.created_at)}</small></td>
                                      <td>
                                        <span className="badge bg-success commission-badge">
                                          {formatCurrency(ref.commission_amount, user.currency)}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${ref.commission_paid ? 'bg-success' : 'bg-warning text-dark'}`}>
                                          {ref.commission_paid ? 'Paid' : 'Pending'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card View for Referrals */}
                            <div className="d-md-none">
                              {user.referrals.map((ref, idx) => (
                                <div key={idx} className="referral-item p-2 p-sm-3 mb-2 rounded">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center flex-grow-1 min-width-0">
                                      <div 
                                        className="user-avatar me-2"
                                        style={{ 
                                          width: '32px', 
                                          height: '32px', 
                                          fontSize: '12px',
                                          backgroundColor: `hsl(${ref.full_name?.charCodeAt(0) * 10 || 100}, 60%, 50%)` 
                                        }}
                                      >
                                        {ref.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                      <div className="min-width-0">
                                        <strong className="text-dark d-block text-truncate" style={{ fontSize: '0.9rem' }}>
                                          {ref.full_name || 'N/A'}
                                        </strong>
                                        <small className="text-muted d-block text-truncate">{ref.email}</small>
                                      </div>
                                    </div>
                                    {/* <span className={`badge ms-2 ${ref.commission_paid ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>
                                      {ref.commission_paid ? 'Paid' : 'Pending'}
                                    </span> */}
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      <i className="bi bi-calendar me-1"></i>
                                      {formatDate(ref.created_at)}
                                    </small>
                                    <span className="badge bg-success commission-badge">
                                      {formatCurrency(ref.commission_amount, user.currency)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3 mt-md-4">
                  <nav>
                    <ul className="pagination pagination-sm pagination-md mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => {
                        // Show limited pages on mobile
                        const pageNum = index + 1;
                        const showPage = totalPages <= 5 || 
                          pageNum === 1 || 
                          pageNum === totalPages || 
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                        
                        if (!showPage) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                          }
                          return null;
                        }
                        
                        return (
                          <li
                            key={pageNum}
                            className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}

          <Smallfooter />
        </div>
      </div>
    </>
  );
};

export default ReferalTransactions;
