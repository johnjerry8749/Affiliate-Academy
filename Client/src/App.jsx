
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { supabase } from '../supabase.js';
import Nav from './components/Layout/Nav.jsx';
import Footer from './components/Layout/Footer.jsx';
import Home from './components/pages/Home.jsx';
import Affiliate from './components/pages/Affiliate.jsx';
import Services from './components/pages/Services.jsx';
import RealEstate from './components/pages/RealEstate.jsx';
import Faqs from './components/pages/Faqs.jsx';
import Register from './components/pages/Register.jsx';
import Login from './components/pages/Login.jsx';
import NotFound from './components/pages/NotFound.jsx';
import Terms from './components/pages/Terms.jsx';
import ForgotPassword from './components/pages/ForgotPassword.jsx';
import ResetPassword from './components/pages/Resetpassword.jsx';
import CryptoPayment from './components/pages/Cryptopayment.jsx';
import AdminForgotPassword from './components/Admin/ForgotPassword.jsx';
import AdminResetPassword from './components/Admin/AdminResetPassword.jsx';

import Dashboard from './components/Users/Dashboard.jsx';
import Profile from './components/Users/Profile.jsx';
import ProgramAccess from './components/Users/ProgramAccess.jsx';
import WatchCourse from './components/Users/watchcourse.jsx';
import Estate from './components/Users/Estates.jsx';
import Product from './components/Users/Products.jsx';
import Payment from './components/Users/Payment.jsx';
import Invite from './components/Users/Invite.jsx';

import AdminLogin from './components/Admin/AdminLogin.jsx';
import AdminDashboard from './components/Admin/pages/AdminDashboard.jsx';
import AdminDashboardPage from './components/Admin/pages/Dashboard.jsx';
import ManageUsers from './components/Admin/pages/Manageusers.jsx';
import CourseManagement from './components/Admin/pages/CourseManagement.jsx';
import WithdrawRequest from './components/Admin/pages/Withdrawrequest.jsx';
import AddEstate from './components/Admin/pages/AddEstate.jsx';
import SystemConfig from './components/Admin/pages/SystemConfig.jsx';
import AdminCrypto from './components/Admin/pages/AdminCrypto.jsx'

import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthProvider';  // ← NEW: useAuth instead of useUser
import AdminProtected from './components/Admin/AdminProtected.jsx';
// ============================================================
// Layout Component
// ============================================================
const Layout = () => {
  const location = useLocation();
  const { profile } = useAuth();  // ← useAuth instead of useUser

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Current user:", data.session?.user);
    };
    checkSession();
  }, []);

  // Hide Nav & Footer on these routes
  const hideNavAndFooter =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/404' ||
    location.pathname === '/adminlogin' ||
    location.pathname == '/forgot-passwordAdmin' ||
    location.pathname =='/AdminLogin' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/user/');


  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideNavAndFooter && <Nav />}

      <main className="flex-grow-1">
        <Routes>
          {/* ==================== Public Routes ==================== */}
          <Route path="/" element={<Home />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/services" element={<Services />} />
          <Route path="/real-estate" element={<RealEstate />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Terms />} />
          <Route path="/crypto-payment" element={<CryptoPayment />} />


          {/* ==================== Protected User Routes ==================== */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/program-access" element={<ProtectedRoute><ProgramAccess /></ProtectedRoute>} />
          <Route path="/user/watch-course" element={<ProtectedRoute><WatchCourse /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard/estate" element={<ProtectedRoute><Estate /></ProtectedRoute>} />
          <Route path="/dashboard/products" element={<ProtectedRoute><Product /></ProtectedRoute>} />
          <Route path="/dashboard/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/dashboard/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />

          {/* ==================== Admin Routes ==================== */}
          <Route path="/AdminLogin" element={<AdminLogin />} />
          <Route path='/forgot-passwordAdmin' element={<AdminForgotPassword/>}/>
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />

          <Route
            path="/admin/dashboard"
            element={

              <AdminProtected>
                <AdminDashboard />
              </AdminProtected>
            }
          />

          <Route
            path="/admin/users/all"
            element={
              <AdminProtected>
                <ManageUsers />
              </AdminProtected>
            }
          />
          <Route
            path="/admin/courses/upload"
            element={
              <AdminProtected>
                <CourseManagement />
              </AdminProtected>
            }
          />

          <Route
            path="/admin/payments"
            element={
              <AdminProtected>
                <WithdrawRequest />
              </AdminProtected>
            }
          />
          <Route
            path="/admin/realestate"
            element={
              <AdminProtected>
                <AddEstate />
              </AdminProtected>
            }
          />
          
          <Route
            path="/admin/userspaymentcrypto"
            element={
              <AdminProtected>
                <AdminCrypto />
              </AdminProtected>
            }
          />
          <Route
            path="/admin/settings/general"
            element={
              <AdminProtected>
                <SystemConfig />
              </AdminProtected>
            }
          />


          {/* ==================== 404 Fallback ==================== */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>

      {!hideNavAndFooter && <Footer />}
    </div>
  );
};

// ============================================================
// Main App
// ============================================================
const App = () => (
  <Router>
    <Layout />
  </Router>
);

export default App;


// // src/App.jsx  (only the changed parts are highlighted)
// import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
// import React from 'react';
// import Nav from './components/Layout/Nav.jsx';
// import Footer from './components/Layout/Footer.jsx';
// import Home from './components/pages/Home.jsx';
// import Affiliate from './components/pages/Affiliate.jsx';
// import Services from './components/pages/Services.jsx';
// import RealEstate from './components/pages/RealEstate.jsx';
// import Faqs from './components/pages/Faqs.jsx';
// import Register from './components/pages/Register.jsx';
// import Login from './components/pages/Login.jsx';
// import NotFound from './components/pages/NotFound.jsx';
// import Terms from './components/pages/Terms.jsx';
// import ForgotPassword from './components/pages/ForgotPassword.jsx';
// import ResetPassword from './components/pages/Resetpassword.jsx';

// import Dashboard from './components/Users/Dashboard.jsx';
// import Profile from './components/Users/Profile.jsx';
// import ProgramAccess from './components/Users/ProgramAccess.jsx';
// import Estate from './components/Users/Estates.jsx';
// import Product from './components/Users/Products.jsx';
// import Payment from './components/Users/Payment.jsx';
// import Invite from './components/Users/Invite.jsx';

// import AdminLogin from './components/Admin/AdminLogin.jsx';
// import AdminDashboard from './components/Admin/pages/AdminDashboard.jsx';

// import { ProtectedRoute } from './components/ProtectedRoute.jsx';
// import { AdminProtectedRoute } from './components/Admin/AdminProtectedRoute.jsx';
// import { useAuth } from './context/AuthProvider';   // <-- NEW

// const Layout = () => {
//   const location = useLocation();
//   const { profile } = useAuth();

//   const hideNavAndFooter =
//     location.pathname === '/login' ||
//     location.pathname === '/register' ||
//     location.pathname === '/404' ||
//     location.pathname === '/AdminLogin' ||
//     location.pathname.startsWith('/dashboard') ||
//     location.pathname.startsWith('/admin/dashboard');

//   return (
//     <div className="d-flex flex-column min-vh-100">
//       {!hideNavAndFooter && <Nav />}

//       <main className="flex-grow-1">
//         <Routes>
//           {/* Public routes … (unchanged) */}

//           {/* USER PROTECTED */}
//           <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//           {/* … other user routes … */}

//           {/* ADMIN */}
//           <Route path="/AdminLogin" element={<AdminLogin />} />

//           <Route
//             path="/admin/dashboard"
//             element={
//               <AdminProtectedRoute>
//                 <AdminDashboard />
//               </AdminProtectedRoute>
//             }
//           />

//           {/* 404 */}
//           <Route path="/404" element={<NotFound />} />
//           <Route path="*" element={<Navigate to="/404" replace />} />
//         </Routes>
//       </main>

//       {!hideNavAndFooter && <Footer />}
//     </div>
//   );
// };

// const App = () => (
//   <Router>
//     <Layout />
//   </Router>
// );

// export default App;