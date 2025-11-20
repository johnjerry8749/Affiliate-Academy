import React, { useState, useEffect } from 'react'
import AdminSidebar from '../adminLayout/AdminSidebar'
import Smallfooter from '../../Users/UserLayout/smallfooter'
import { supabase } from '../../../../supabase'
import './admincss/AdminDashboard.css'
 const token = localStorage.getItem('adminToken');
import { fetchDashboardDataFromBackend } from '../../../api/adminApi'
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    totalCourses: 0,
    totalBalance: 0,
    totalRegistrationDeposits: 0,
    totalTransactions: 0,
    totalPayout: 0,
    loading: true
  });
  const [error, setError] = useState('');

  // Fetch dashboard analytics data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    setError('');
    setDashboardData(prev => ({ ...prev, loading: true }));

    const data = await fetchDashboardDataFromBackend(token);
    setDashboardData({ ...data, loading: false });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    setError('Failed to load dashboard data. Please try again.');
    setDashboardData(prev => ({ ...prev, loading: false }));
  }
};


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (dashboardData.loading) {
    return (
      <div className="admin-layout d-flex">
        <AdminSidebar />
        <div className="admin-content admin-responsive-content admin-main-content flex-grow-1" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
          <div className="spinner-container">
            <div className="spinner-content">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-dark">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-layout d-flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      <div className="admin-content admin-responsive-content admin-main-content flex-grow-1 d-flex flex-column" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
        <div className="flex-grow-1 px-3">
          {/* Header */}
          <div className="mb-4 pt-3">
            <h1 className="h4 mb-1 text-dark fw-bold">Dashboard</h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Welcome, Admin manager!</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

       

          {/* Analytics Cards Row 1 */}
          <div className="row g-3 mb-3">
          {/* Total Deposit Registration */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Total Deposit Registration</p>
                    <h4 className="mb-0 fw-bold text-dark">{formatCurrency(dashboardData.totalRegistrationDeposits)}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-cash-coin text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Withdrawal Requests */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Total Withdrawal Requests</p>
                    <h4 className="mb-0 fw-bold text-dark">{formatCurrency(dashboardData.totalPayout)}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-arrow-up-circle text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards Row 2 */}
        <div className="row g-3 mb-4">
          {/* Total Users Balance */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Total Users Balance</p>
                    <h4 className="mb-0 fw-bold text-dark">{formatCurrency(dashboardData.totalBalance)}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-wallet2 text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>All Users</p>
                    <h4 className="mb-0 fw-bold text-dark">{dashboardData.totalUsers}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-person-check-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Total Courses</p>
                    <h4 className="mb-0 fw-bold text-dark">{dashboardData.totalCourses}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-diagram-3-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards Row 3 */}
        <div className="row g-3 mb-4">
          {/* Inactive Users */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Inactive Users</p>
                    <h4 className="mb-0 fw-bold text-dark">{dashboardData.inactiveUsers}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-person-dash text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Users */}
          <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12">
            <div className="card border-0 h-100" style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Blocked Users</p>
                    <h4 className="mb-0 fw-bold text-dark">{dashboardData.blockedUsers}</h4>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-person-x-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sticky Footer */}
        <div className="mt-auto w-100">
          <Smallfooter />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard



// import React, { useEffect, useState } from 'react';
// // import { useAdmin } from '../context/AdminContext';
// // import { useAdmin } from '../../context/AdminContext';
// import { useAdmin } from '../../../context/AdminContext';

// const AdminDashboard = () => {
//   const { token, admin, logout } = useAdmin();
//   const [profile, setProfile] = useState(admin || null);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/admin/profile`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!res.ok) throw new Error('Failed');
//         const data = await res.json();
//         setProfile(data);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     if (!profile && token) fetchProfile();
//   }, [token]);

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Admin Dashboard</h2>
//       {profile ? (
//         <>
//           <p>Welcome, {profile.email}</p>
//           <p>Role: {profile.role}</p>
//           <button onClick={logout}>Logout</button>
//         </>
//       ) : (
//         <p>Loading profile...</p>
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;
