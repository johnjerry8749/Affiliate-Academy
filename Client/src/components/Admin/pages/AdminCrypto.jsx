import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';
import { supabase } from '../../../../supabase';

const AdminCrypto = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedProof, setSelectedProof] = useState(null);
  const paymentsPerPage = 10;
  const token = localStorage.getItem('adminToken');
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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('crypto_payments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (searchQuery.trim()) {
        query = query.or(`wallet_address.ilike.%${searchQuery}%,wallet_name.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * paymentsPerPage;
      const to = from + paymentsPerPage - 1;
      query = query.range(from, to);

      const { data: paymentData, error: paymentError, count } = await query;

      if (paymentError) throw paymentError;

      // Fetch user data for each payment
      if (paymentData && paymentData.length > 0) {
        const userIds = [...new Set(paymentData.map(p => p.user_id))];

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Map users to payments
        const paymentsWithUsers = paymentData.map(payment => ({
          ...payment,
          user: usersData.find(user => user.id === payment.user_id) || null
        }));

        setPayments(paymentsWithUsers);
      } else {
        setPayments([]);
      }

      setTotalPayments(count || 0);
    } catch (error) {
      console.error('Error fetching crypto payments:', error);
      showLiveAlert('Failed to fetch crypto payments', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, filterStatus]);

  // const updatePaymentStatus = async (paymentId, newStatus) => {
  //   try {
  //     console.log('Updating payment:', paymentId, 'to status:', newStatus);

  //     // Step 1: Get the crypto payment record (to get user_id)
  //     const { data: payment, error: fetchError } = await supabase
  //       .from('crypto_payments')
  //       .select('user_id, status')
  //       .eq('id', paymentId)
  //       .single();

  //     if (fetchError) throw fetchError;
  //     if (!payment) throw new Error('Payment not found');

  //     // Prevent double-approval or changing rejected
  //     if (payment.status === 'approved') {
  //       showLiveAlert('This payment is already approved!', 'info');
  //       return;
  //     }
  //     if (payment.status === 'rejected' && newStatus === 'approved') {
  //       showLiveAlert('Cannot approve a rejected payment', 'warning');
  //       return;
  //     }

  //     // Step 2: Update the crypto_payments table
  //     const { data: updatedPayment, error: updateError } = await supabase
  //       .from('crypto_payments')
  //       .update({
  //         status: newStatus,
  //         updated_at: new Date().toISOString(),
  //       })
  //       .eq('id', paymentId)
  //       .select()
  //       .single();

  //     if (updateError) throw updateError;

  //     // Step 3: If APPROVED → Update user.paid = true
  //     if (newStatus === 'approved') {
  //       const { error: userError } = await supabase
  //         .from('users')
  //         .update({
  //           paid: true,
  //           updated_at: new Date().toISOString(),
  //         })
  //         .eq('id', payment.user_id);

  //       if (userError) {
  //         console.error('Failed to activate user:', userError);
  //         showLiveAlert('Payment approved, but failed to activate user account!', 'danger');
  //         return;
  //       }

  //       console.log('User activated:', payment.user_id);
  //       showLiveAlert('Payment approved & user account activated!', 'success');
  //     }
  //     else if (newStatus === 'rejected') {
  //       showLiveAlert('Payment rejected.', 'info');
  //     }

  //     // Refresh the list
  //     fetchPayments();

  //   } catch (error) {
  //     console.error('Error in updatePaymentStatus:', error);
  //     showLiveAlert('Failed: ' + error.message, 'danger');
  //   }
  // };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      console.log('Updating payment:', paymentId, 'to status:', newStatus);
      
      // Use backend API with authentication
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/crypto-payment/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          status: newStatus,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to update payment status');
      }

      console.log('Update successful:', result);
      showLiveAlert(
        newStatus === 'approved'
          ? 'Payment approved & user activated!'
          : 'Payment rejected.',
        'success'
      );
      
      fetchPayments();
    } catch (err) {
      console.error('Error updating payment:', err);
      showLiveAlert('Failed: ' + err.message, 'danger');
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

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-success text-white',
      'rejected': 'bg-danger text-white'
    };
    return badges[status] || 'bg-secondary text-white';
  };

  const openProofModal = (proofUrl) => {
    setSelectedProof(proofUrl);
  };

  const closeProofModal = () => {
    setSelectedProof(null);
  };

  const totalPages = Math.ceil(totalPayments / paymentsPerPage);

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

          .payment-card {
            transition: all 0.3s ease;
            border: 1px solid #e0e0e0;
            background-color: white !important;
          }

          .payment-card:hover {
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

          .proof-thumbnail {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .proof-thumbnail:hover {
            transform: scale(1.1);
          }

          .modal-proof-image {
            max-width: 100%;
            max-height: 80vh;
            border-radius: 8px;
          }

          @media (max-width: 768px) {
            .payment-card {
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

        {/* Proof Image Modal */}
        {selectedProof && (
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={closeProofModal}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content bg-transparent border-0">
                <div className="modal-body text-center p-0">
                  <button
                    type="button"
                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                    onClick={closeProofModal}
                    style={{ zIndex: 1 }}
                  ></button>
                  <img
                    src={selectedProof}
                    alt="Payment Proof"
                    className="modal-proof-image"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
              <i className="bi bi-currency-bitcoin me-2 text-primary"></i>
              Crypto Payment Approvals
            </h2>
            <p className="text-muted">Review and approve user crypto payment proofs</p>
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
                      placeholder="Search by wallet address or name..."
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
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center h-100">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Total: {totalPayments} payments
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
              <p className="mt-3 text-muted">Loading crypto payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No crypto payments found</h5>
                <p className="text-muted">There are no crypto payments matching your criteria.</p>
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
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th className="border-0 py-3 ps-4">User ID</th>
                          <th className="border-0 py-3">Wallet Info</th>
                          <th className="border-0 py-3">Payment Proof</th>
                          <th className="border-0 py-3">Status</th>
                          <th className="border-0 py-3">Submitted</th>
                          <th className="border-0 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="ps-4">
                              <div>
                                <small className="font-monospace text-muted">
                                  {payment.user_id || 'N/A'}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <small>
                                  <strong>Wallet:</strong> {payment.wallet_name}<br />
                                  <strong>Address:</strong> <span className="font-monospace text-muted">{payment.wallet_address.slice(0, 20)}...</span>
                                </small>
                              </div>
                            </td>
                            <td>
                              <img
                                src={payment.payment_proof_url}
                                alt="Payment Proof"
                                className="proof-thumbnail"
                                onClick={() => openProofModal(payment.payment_proof_url)}
                              />
                            </td>
                            <td>
                              <span className={`badge status-badge ${getStatusBadge(payment.status)}`}>
                                {payment.status?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(payment.created_at)}</small>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updatePaymentStatus(payment.id, 'approved')}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => updatePaymentStatus(payment.id, 'rejected')}
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
              {/* Mobile-Optimized Card View (replaces full table on small screens) */}
              <div className="d-lg-none">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="card mb-3 shadow-sm border-0"
                    style={{ borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <div className="card-body p-3">
                      {/* Header: User ID + Status */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <small className="text-muted d-block">User ID</small>
                          <span className="font-monospace fw-bold">
                            {payment.user_id || 'N/A'}
                          </span>
                        </div>
                        <span className={`badge ${getStatusBadge(payment.status)} fs-6`}>
                          {payment.status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Wallet Info */}
                      <div className="mb-3">
                        <small className="text-muted d-block">Wallet</small>
                        <div className="fw-medium">
                          {payment.wallet_name}
                          <br />
                          <span className="font-monospace text-muted small">
                            {payment.wallet_address.slice(0, 10)}...{payment.wallet_address.slice(-8)}
                          </span>
                        </div>
                      </div>

                      {/* Proof Thumbnail */}
                      <div className="mb-3 text-center">
                        <img
                          src={payment.payment_proof_url}
                          alt="Proof"
                          className="proof-thumbnail rounded"
                          style={{
                            maxHeight: '120px',
                            cursor: 'pointer',
                            border: '1px solid #dee2e6'
                          }}
                          onClick={() => openProofModal(payment.payment_proof_url)}
                        />
                      </div>

                      {/* Submitted Date */}
                      <div className="text-muted small mb-3">
                        Submitted: {formatDate(payment.created_at)}
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm flex-fill"
                          onClick={() => updatePaymentStatus(payment.id, 'approved')}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm flex-fill"
                          onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

export default AdminCrypto;