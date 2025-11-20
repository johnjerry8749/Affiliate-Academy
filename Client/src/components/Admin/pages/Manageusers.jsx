import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';
import { supabase } from '../../../../supabase';
import { fetchUsersList, deleteUserById, getUserBalance ,updateUserBalance} from '../../../api/adminApi';



const Manageusers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSendMailModal, setShowSendMailModal] = useState(false);
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [editedBalanceInfo, setEditedBalanceInfo] = useState({});
  const [editedUserInfo, setEditedUserInfo] = useState({});
  const usersPerPage = 10;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('adminToken');
  console.log('Admin Token in Manageusers:', token); // Debugging line


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

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      wrapper.remove();
    }, 5000);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUsers();
    console.log(fetchUsersList());

    // Check sidebar state on mount and listen for changes
    const checkSidebarState = () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
      }
    };

    checkSidebarState();

    // Observer to watch for sidebar class changes
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

      return () => observer.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);



  const fetchUsers = async () => {
    try {
      setLoading(true);
      // const token = localStorage.getItem('adminToken'); // ensure this matches your stored key
      const data = await fetchUsersList(token, currentPage, usersPerPage, searchQuery);

      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);


  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const toggleDropdown = (userId, event) => {
    if (activeDropdown === userId) {
      setActiveDropdown(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 200
      });
      setActiveDropdown(userId);
    }
  };

  const handleSendMail = (user) => {
    setSelectedUser(user);
    setShowSendMailModal(true);
    setActiveDropdown(null);
  };



  const handleEditBalance = async (user) => {
    setSelectedUser(user);

    try {
      const token = localStorage.getItem("adminToken");

      // Call backend instead of Supabase
      const balance = await getUserBalance(token, user.id);

      setEditedBalanceInfo({
        available_balance: balance.available_balance || 0,
        pending_balance: balance.pending_balance || 0,
        total_earned: balance.total_earned || 0,
        total_withdrawn: balance.total_withdrawn || 0,
        currency: balance.currency || user.currency,
      });

    } catch (error) {
      console.error("Error fetching balance:", error);

      setEditedBalanceInfo({
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        currency: user.currency,
      });
    }

    setShowEditBalanceModal(true);
    setActiveDropdown(null);
  };


  const handleEditUserInfo = (user) => {
    setSelectedUser(user);
    setEditedUserInfo({
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      country: user.country || '',
      currency: user.currency || '',
      payment_method: user.payment_method || '',
      account_number: user.account_number || '',
      bank_name: user.bank_name || '',
      home_address: user.home_address || '',
      agreed_to_terms: user.agreed_to_terms || false,
      paid: user.paid || false,
    });
    setShowEditInfoModal(true);
    setActiveDropdown(null);
  };


  const submitSendMail = async () => {
    if (!mailSubject.trim() || !mailMessage.trim()) {
      showLiveAlert('Please fill in all fields', 'warning');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/send-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: mailSubject,
          message: mailMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showLiveAlert('Email sent successfully!', 'success');
        setShowSendMailModal(false);
        setMailSubject('');
        setMailMessage('');
      } else {
        showLiveAlert(data.error || 'Failed to send email', 'danger');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showLiveAlert('Server error. Try again later.', 'danger');
    }
  };
const submitEditBalance = async () => {
  if (!editedBalanceInfo.available_balance && editedBalanceInfo.available_balance !== 0) {
    showLiveAlert('Please enter a valid balance amount', 'warning');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');

    const balanceData = {
      amount: Number(editedBalanceInfo.available_balance) || 0
    };

    const res = await updateUserBalance(token, selectedUser.id, balanceData);

    if (res.success) {
      showLiveAlert(res.message || 'Balance updated successfully!', 'success');
      setShowEditBalanceModal(false);
      setEditedBalanceInfo({});
      setSelectedUser(null);
      fetchUsers();
    } else {
      showLiveAlert(res.error || 'Failed to update balance', 'danger');
    }

  } catch (error) {
    console.error('Error updating balance:', error);
    showLiveAlert(error.message || 'Failed to update balance', 'danger');
  }
};



  // const submitEditBalance = async () => {
  //   if (!editedBalanceInfo.available_balance && editedBalanceInfo.available_balance !== 0) {
  //     showLiveAlert('Please enter valid balance amounts', 'warning');
  //     return;
  //   }

  //   try {
  //     // Check if user has a balance record
  //     const { data: existingBalance } = await supabase
  //       .from('user_balances')
  //       .select('*')
  //       .eq('user_id', selectedUser.id)
  //       .single();

  //     const balanceData = {
  //       available_balance: parseFloat(editedBalanceInfo.available_balance) || 0,
  //       pending_balance: parseFloat(editedBalanceInfo.pending_balance) || 0,
  //       total_earned: parseFloat(editedBalanceInfo.total_earned) || 0,
  //       total_withdrawn: parseFloat(editedBalanceInfo.total_withdrawn) || 0,
  //       currency: editedBalanceInfo.currency || 'USD',
  //       updated_at: new Date().toISOString(),
  //     };

  //     if (existingBalance) {
  //       // Update existing balance
  //       const { error } = await supabase
  //         .from('user_balances')
  //         .update(balanceData)
  //         .eq('user_id', selectedUser.id);

  //       if (error) throw error;
  //     } else {
  //       // Create new balance record
  //       const { error } = await supabase
  //         .from('user_balances')
  //         .insert({
  //           user_id: selectedUser.id,
  //           ...balanceData,
  //         });

  //       if (error) throw error;
  //     }

  //     showLiveAlert('Balance updated successfully!', 'success');
  //     setShowEditBalanceModal(false);
  //     setEditedBalanceInfo({});
  //     setSelectedUser(null);
  //     fetchUsers();
  //   } catch (error) {
  //     console.error('Error updating balance:', error);
  //     showLiveAlert('Failed to update balance', 'danger');
  //   }
  // };

  const submitEditUserInfo = async () => {
    if (!editedUserInfo.full_name || !editedUserInfo.email) {
      showLiveAlert('Name and email are required', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(editedUserInfo)
        .eq('id', selectedUser.id);

      if (error) throw error;

      showLiveAlert('User information updated successfully!', 'success');
      setShowEditInfoModal(false);
      setEditedUserInfo({});
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user info:', error);
      showLiveAlert('Failed to update user information', 'danger');
    }
  };

  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };



  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Missing admin token');

      await deleteUserById(userToDelete.id, token);

      showLiveAlert('User deleted successfully!', 'success');
      fetchUsers(); // refresh list
    } catch (error) {
      console.error('Error deleting user:', error);
      showLiveAlert(error.message || 'Failed to delete user', 'danger');
    }

    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div className="admin-layout d-flex">
        <AdminSidebar />

        {/* Live Alert Placeholder */}
        <div
          id="liveAlertPlaceholder"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            minWidth: '300px'
          }}
        ></div>

        <div
          className="admin-content admin-responsive-content flex-grow-1 d-flex flex-column"
          style={{
            backgroundColor: 'white',
            minHeight: '100vh',
            marginLeft: windowWidth > 991 ? (isSidebarCollapsed ? '70px' : '280px') : '0',
            transition: 'margin-left 0.3s ease',
            width: windowWidth > 991 ? (isSidebarCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 280px)') : '100%'
          }}
        >
          <div className="flex-grow-1 px-3 mt-5">
            {/* Header */}
            <div className="mb-4 pt-3">
              <h1 className="h4 mb-1 text-dark fw-bold">Manage Users</h1>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>View and manage all registered users</p>
            </div>

            {/* Search and Actions */}
            <div className="row g-3 mb-4">
              <div className="col-lg-6">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by name, username or email"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="card border-0 shadow-sm" style={{
              overflow: 'visible',
              backgroundColor: 'transparent',
              boxShadow: 'none'
            }}>
              <div className="card-body p-0" style={{
                backgroundColor: 'transparent'
              }}>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading users...</p>
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    WebkitOverflowScrolling: 'touch',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e0 #f7fafc'
                  }}>
                    <table className="table table-hover mb-0" style={{ minWidth: '800px' }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th className="border-0 py-3 ps-4" style={{ minWidth: '200px' }}>Name</th>
                          <th className="border-0 py-3" style={{ minWidth: '220px' }}>Email</th>
                          <th className="border-0 py-3" style={{ minWidth: '150px' }}>Phone Number</th>
                          <th className="border-0 py-3" style={{ minWidth: '150px' }}>Created Date</th>
                          <th className="border-0 py-3" style={{ minWidth: '100px' }}>Status</th>
                          <th className="border-0 py-3" style={{ minWidth: '100px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-5 text-muted">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id}>
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  {user.avatar_url ? (
                                    <img
                                      src={user.avatar_url}
                                      alt={user.full_name || 'User'}
                                      className="me-2"
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        flexShrink: 0,
                                        border: '2px solid #e9ecef'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="me-2"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      display: user.avatar_url ? 'none' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '16px',
                                      flexShrink: 0
                                    }}
                                  >
                                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                  <span className="fw-medium text-dark">{user.full_name || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="text-primary">{user.email || 'N/A'}</td>
                              <td className="text-muted">{user.phone_number || 'N/A'}</td>
                              <td className="text-muted">{formatDate(user.created_at)}</td>
                              <td>
                                <span className={`badge ${user.is_blocked ? 'bg-danger' : 'bg-success'}`}>
                                  {user.is_blocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td>
                                <div className="dropdown" style={{ position: 'static' }}>
                                  <button
                                    className="btn btn-sm btn-primary dropdown-toggle"
                                    type="button"
                                    onClick={(e) => toggleDropdown(user.id, e)}
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <p className="text-muted mb-0">
                  Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                </p>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="mt-auto w-100">
            <Smallfooter />
          </div>
        </div>

        {/* Dropdown Menu - Positioned outside scroll container */}
        {activeDropdown && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1040
              }}
              onClick={() => setActiveDropdown(null)}
            />
            {users.map((user) =>
              activeDropdown === user.id ? (
                <div
                  key={user.id}
                  className="dropdown-menu show"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    zIndex: 1050,
                    minWidth: '200px'
                  }}
                >
                  <button
                    className="dropdown-item text-info"
                    onClick={() => handleSendMail(user)}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Send Mail
                  </button>
                  <button
                    className="dropdown-item text-primary"
                    onClick={() => handleEditBalance(user)}
                  >
                    <i className="bi bi-wallet2 me-2"></i>
                    Edit Balance
                  </button>
                  <button
                    className="dropdown-item text-secondary"
                    onClick={() => handleEditUserInfo(user)}
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit User Info
                  </button>
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Delete User
                  </button>
                </div>
              ) : null
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: '400px',
            height: '100vh',
            backgroundColor: 'white',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 9999,
            overflowY: 'auto',
            transform: showDeleteConfirm ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out'
          }}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                ></button>
              </div>
              <hr />

              <div className="text-center py-3">
                <i className="bi bi-trash" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                <h5 className="mt-3">Delete User Account?</h5>
                <p className="text-muted">
                  Are you sure you want to permanently delete <strong>{userToDelete?.full_name || 'this user'}</strong>?
                </p>
                <div className="alert alert-danger text-start" role="alert">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  This action cannot be undone. All user data will be permanently removed.
                </div>
              </div>

              <hr />
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  <i className="bi bi-trash me-2"></i>Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Mail Modal */}
        {showSendMailModal && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
                animation: 'fadeIn 0.3s ease-in-out'
              }}
              onClick={() => {
                setShowSendMailModal(false);
                setSelectedUser(null);
                setMailSubject('');
                setMailMessage('');
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease-in-out'
              }}>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 text-primary">
                      <i className="bi bi-envelope-fill me-2"></i>
                      Send Email to {selectedUser?.full_name}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowSendMailModal(false);
                        setSelectedUser(null);
                        setMailSubject('');
                        setMailMessage('');
                      }}
                    ></button>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label className="form-label fw-semibold">To:</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control fw-semibold"
                        value={selectedUser?.email || ''}
                        disabled
                      />
                    </div>
                    <small className="text-muted">Recipient: {selectedUser?.full_name || 'Unknown User'}</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Subject: <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter email subject"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Message: <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="8"
                      placeholder="Type your message here..."
                      value={mailMessage}
                      onChange={(e) => setMailMessage(e.target.value)}
                    ></textarea>
                  </div>

                  <hr />
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowSendMailModal(false);
                        setSelectedUser(null);
                        setMailSubject('');
                        setMailMessage('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitSendMail}
                    >
                      <i className="bi bi-send me-2"></i>Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Balance Modal */}
        {showEditBalanceModal && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
                animation: 'fadeIn 0.3s ease-in-out'
              }}
              onClick={() => {
                setShowEditBalanceModal(false);
                setSelectedUser(null);
                setEditedBalanceInfo({});
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease-in-out'
              }}>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 text-primary">
                      <i className="bi bi-wallet2 me-2"></i>
                      Edit User Balance
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowEditBalanceModal(false);
                        setSelectedUser(null);
                        setEditedBalanceInfo({});
                      }}
                    ></button>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label className="form-label fw-semibold">User:</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedUser?.full_name || 'Unknown User'}
                        disabled
                      />
                    </div>
                    <small className="text-muted">Email: {selectedUser?.email || 'N/A'}</small>
                  </div>

                  <div className="alert alert-info d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-cash-coin me-2" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <strong>Currency:</strong> {selectedUser?.currency || 'USD'}
                    </div>
                  </div>

                  <h6 className="text-secondary mb-3 fw-bold mt-4">
                    <i className="bi bi-currency-dollar me-2"></i>Balance Information
                  </h6>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Available Balance: <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={editedBalanceInfo.available_balance || ''}
                        onChange={(e) => setEditedBalanceInfo({ ...editedBalanceInfo, available_balance: e.target.value })}
                        step="0.01"
                        min="0"
                      />
                      <small className="text-muted">Current available balance</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Pending Balance:</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={editedBalanceInfo.pending_balance || ''}
                        onChange={(e) => setEditedBalanceInfo({ ...editedBalanceInfo, pending_balance: e.target.value })}
                        step="0.01"
                        min="0"
                      />
                      <small className="text-muted">Balance pending approval</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Total Earned:</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={editedBalanceInfo.total_earned || ''}
                        onChange={(e) => setEditedBalanceInfo({ ...editedBalanceInfo, total_earned: e.target.value })}
                        step="0.01"
                        min="0"
                      />
                      <small className="text-muted">Total earnings to date</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Total Withdrawn:</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={editedBalanceInfo.total_withdrawn || ''}
                        onChange={(e) => setEditedBalanceInfo({ ...editedBalanceInfo, total_withdrawn: e.target.value })}
                        step="0.01"
                        min="0"
                      />
                      <small className="text-muted">Total amount withdrawn</small>
                    </div>
                  </div>

                  <div className="alert alert-info mt-3" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> All amounts are in {selectedUser?.currency || 'USD'}. Changes will be saved immediately.
                  </div>

                  <hr />
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEditBalanceModal(false);
                        setSelectedUser(null);
                        setEditedBalanceInfo({});
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitEditBalance}
                    >
                      <i className="bi bi-check-circle me-2"></i>Update Balance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit User Info Modal */}
        {showEditInfoModal && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
                animation: 'fadeIn 0.3s ease-in-out'
              }}
              onClick={() => {
                setShowEditInfoModal(false);
                setSelectedUser(null);
                setEditedUserInfo({});
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease-in-out'
              }}>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 text-primary">
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit User Information
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowEditInfoModal(false);
                        setSelectedUser(null);
                        setEditedUserInfo({});
                      }}
                    ></button>
                  </div>
                  <hr />

                  {/* User Info Display */}
                  <div className="alert alert-primary d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-person-circle me-2" style={{ fontSize: '2rem' }}></i>
                    <div>
                      <strong>Editing User:</strong> {selectedUser?.full_name || 'Unknown User'}<br />
                      <small>User ID: {selectedUser?.id || 'N/A'}</small>
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <h6 className="text-secondary mb-3 fw-bold">
                    <i className="bi bi-person-badge me-2"></i>Personal Information
                  </h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Full Name: <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter full name"
                        value={editedUserInfo.full_name || ''}
                        onChange={(e) => setEditedUserInfo({ ...editedUserInfo, full_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Email: <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter email address"
                        value={editedUserInfo.email || ''}
                        onChange={(e) => setEditedUserInfo({ ...editedUserInfo, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Phone Number:</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Enter phone number"
                        value={editedUserInfo.phone_number || ''}
                        onChange={(e) => setEditedUserInfo({ ...editedUserInfo, phone_number: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Country:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter country"
                        value={editedUserInfo.country || ''}
                        onChange={(e) => setEditedUserInfo({ ...editedUserInfo, country: e.target.value })}
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Home Address:</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Enter home address"
                        value={editedUserInfo.home_address || ''}
                        onChange={(e) => setEditedUserInfo({ ...editedUserInfo, home_address: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Payment Information Section (Read-Only) */}
                  <h6 className="text-secondary mb-3 fw-bold">
                    <i className="bi bi-credit-card me-2"></i>Payment Information
                  </h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Currency:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedUserInfo.currency || 'N/A'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Bank Name:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedUserInfo.bank_name || 'N/A'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Account Number:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedUserInfo.account_number || 'N/A'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Account Status Section */}
                  <h6 className="text-secondary mb-3 fw-bold">
                    <i className="bi bi-shield-check me-2"></i>Account Status
                  </h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="agreedToTerms"
                          checked={editedUserInfo.agreed_to_terms || false}
                          onChange={(e) => setEditedUserInfo({ ...editedUserInfo, agreed_to_terms: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="agreedToTerms">
                          Agreed to Terms
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4 mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="paidStatus"
                          checked={editedUserInfo.paid || false}
                          onChange={(e) => setEditedUserInfo({ ...editedUserInfo, paid: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="paidStatus">
                          Paid Status
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-3" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> Fields marked with <span className="text-danger">*</span> are required. Changes will be saved to the database immediately.
                  </div>

                  <hr />
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEditInfoModal(false);
                        setSelectedUser(null);
                        setEditedUserInfo({});
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitEditUserInfo}
                    >
                      <i className="bi bi-save me-2"></i>Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Manageusers;