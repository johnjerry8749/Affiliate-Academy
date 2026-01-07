import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';
import { supabase } from '../../../../supabase';

const Withdrawrequest = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const withdrawalsPerPage = 10;

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

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      // First, fetch withdrawal requests
      let query = supabase
        .from('withdrawal_requests')
        .select('*, account_details', { count: 'exact' })
        .order('request_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (searchQuery.trim()) {
        query = query.or(`transaction_id.ilike.%${searchQuery}%,amount.eq.${parseFloat(searchQuery) || 0}`);
      }

      const from = (currentPage - 1) * withdrawalsPerPage;
      const to = from + withdrawalsPerPage - 1;
      query = query.range(from, to);

      const { data: withdrawalData, error: withdrawalError, count } = await query;

      if (withdrawalError) throw withdrawalError;

      // Fetch user data for each withdrawal
      if (withdrawalData && withdrawalData.length > 0) {
        const userIds = [...new Set(withdrawalData.map(w => w.user_id))];
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, bank_name, account_number, payment_method, currency')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Map users to withdrawals
        const withdrawalsWithUsers = withdrawalData.map(withdrawal => ({
          ...withdrawal,
          users: usersData.find(user => user.id === withdrawal.user_id) || null
        }));

        setWithdrawals(withdrawalsWithUsers);
      } else {
        setWithdrawals([]);
      }

      setTotalWithdrawals(count || 0);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      showLiveAlert('Failed to fetch withdrawal requests', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, filterStatus]);

  const updateWithdrawalStatus = async (withdrawalId, newStatus) => {
    try {
      console.log('Updating withdrawal:', withdrawalId, 'to status:', newStatus);
      
      // Use backend API instead of direct Supabase
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/withdrawal/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update withdrawal status');
      }

      console.log('Update successful:', result);
      showLiveAlert(`Withdrawal ${newStatus} successfully!`, 'success');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      showLiveAlert('Failed to update withdrawal status: ' + error.message, 'danger');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'GHS': '₵',
      'KES': 'KSh',
      'ZAR': 'R'
    };
    return `${symbols[currency] || '$'}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-info text-white',
      'processed': 'bg-success text-white',
      'rejected': 'bg-danger text-white'
    };
    return badges[status] || 'bg-secondary text-white';
  };

  const totalPages = Math.ceil(totalWithdrawals / withdrawalsPerPage);

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .withdrawal-card {
            transition: all 0.3s ease;
            border: 1px solid #e0e0e0;
            background-color: white !important;
          }

          .withdrawal-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }

          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
          }

          .action-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 6px;
            transition: all 0.2s ease;
          }

          .action-btn:hover {
            transform: scale(1.05);
          }

          .card {
            background-color: white !important;
          }

          @media (max-width: 768px) {
            .withdrawal-card {
              margin-bottom: 1rem;
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
            minWidth: '300px'
          }}
        ></div>
        
        <div 
          className="main-content flex-grow-1 p-3 p-md-4"
          style={{
            marginLeft: windowWidth <= 768 ? '0' : (isSidebarCollapsed ? '80px' : '250px'),
            transition: 'margin-left 0.3s ease',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            overflowX: 'hidden'
          }}
        >
          <div className="mb-4 mt-5">
            <h2 className="mb-2 fw-bold">
              <i className="bi bi-cash-stack me-2 text-primary"></i>
              Withdrawal Requests
            </h2>
            <p className="text-muted">Manage and process user withdrawal requests</p>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by transaction ID or amount..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="processed">Processed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center h-100">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Total: {totalWithdrawals} requests
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading withdrawal requests...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No withdrawal requests found</h5>
                <p className="text-muted">There are no withdrawal requests matching your criteria.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="card border-0 shadow-sm d-none d-lg-block" style={{ 
                overflow: 'visible',
                backgroundColor: 'transparent',
                boxShadow: 'none'
              }}>
                <div className="card-body p-0" style={{
                  backgroundColor: 'transparent'
                }}>
                  <div style={{ 
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <table className="table table-hover mb-0">
                      <thead style={{ backgroundColor: '#f8f9fa', fontSize: '13px' }}>
                        <tr>
                          <th className="border-0 py-3 ps-4">Transaction ID</th>
                          <th className="border-0 py-3">User</th>
                          <th className="border-0 py-3">Amount</th>
                          <th className="border-0 py-3">Bank Details</th>
                          <th className="border-0 py-3">Status</th>
                          <th className="border-0 py-3">Request Date</th>
                          <th className="border-0 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id}>
                            <td className="ps-4">
                              <small className="font-monospace text-muted">
                                {withdrawal.transaction_id || withdrawal.id.slice(0, 8)}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{withdrawal.users?.full_name || 'N/A'}</strong>
                                <br />
                                <small className="text-muted">{withdrawal.users?.email || 'N/A'}</small>
                              </div>
                            </td>
                            <td>
                              <strong className="text-primary">
                                {formatCurrency(withdrawal.amount, withdrawal.currency || withdrawal.users?.currency)}
                              </strong>
                            </td>
                            <td>
                              <div>
                                <small>
                                  <strong>Bank:</strong> {withdrawal.account_details || withdrawal.users?.bank_name || 'N/A'}<br />
                                  <strong>Account:</strong> {withdrawal.account_details || 'N/A'}<br />
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge status-badge ${getStatusBadge(withdrawal.status)}`}>
                                {withdrawal.status?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(withdrawal.request_date)}</small>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                                  disabled={withdrawal.status === 'approved' || withdrawal.status === 'rejected'}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Mark as Paid
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => updateWithdrawalStatus(withdrawal.id, 'rejected')}
                                  disabled={withdrawal.status === 'approved' || withdrawal.status === 'rejected'}
                                >
                                  <i className="bi bi-x-circle me-1"></i>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile Table View */}
              <div className="card border-0 shadow-sm d-lg-none" style={{ 
                overflow: 'visible',
                backgroundColor: 'transparent',
                boxShadow: 'none'
              }}>
                <div className="card-body p-0" style={{
                  backgroundColor: 'transparent'
                }}>
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
                    <table className="table table-hover mb-0" style={{ minWidth: '1000px' }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th className="border-0 py-3 ps-4" style={{ minWidth: '150px' }}>Transaction ID</th>
                          <th className="border-0 py-3" style={{ minWidth: '220px' }}>User</th>
                          <th className="border-0 py-3" style={{ minWidth: '120px' }}>Amount</th>
                          <th className="border-0 py-3" style={{ minWidth: '200px' }}>Bank Details</th>
                          <th className="border-0 py-3" style={{ minWidth: '110px' }}>Status</th>
                          <th className="border-0 py-3" style={{ minWidth: '150px' }}>Request Date</th>
                          <th className="border-0 py-3" style={{ minWidth: '260px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id}>
                            <td className="ps-4">
                              <small className="font-monospace text-muted">
                                {withdrawal.transaction_id || withdrawal.id.slice(0, 8)}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{withdrawal.users?.full_name || 'N/A'}</strong>
                                <br />
                                <small className="text-muted">{withdrawal.users?.email || 'N/A'}</small>
                              </div>
                            </td>
                            <td>
                              <strong className="text-primary">
                                {formatCurrency(withdrawal.amount, withdrawal.currency || withdrawal.users?.currency)}
                              </strong>
                            </td>
                            <td>
                              <div>
                                <small>
                                  <strong>Bank:</strong> {withdrawal.account_details || withdrawal.users?.bank_name || 'N/A'}<br />
                                  <strong>Account:</strong> {withdrawal.account_details || 'N/A'}<br />
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge status-badge ${getStatusBadge(withdrawal.status)}`}>
                                {withdrawal.status?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(withdrawal.request_date)}</small>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                                  disabled={withdrawal.status === 'approved' || withdrawal.status === 'rejected'}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Mark as Paid
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => updateWithdrawalStatus(withdrawal.id, 'rejected')}
                                  disabled={withdrawal.status === 'approved' || withdrawal.status === 'rejected'}
                                >
                                  <i className="bi bi-x-circle me-1"></i>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li
                          key={index + 1}
                          className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
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

export default Withdrawrequest;