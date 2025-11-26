import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminLogin, fetchAdminProfile } from '../api/adminApi';
import api from '../api/api.js';
const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('adminData')) || null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !admin) {
      fetchAdminProfile(token)
        .then(profile => {
          setAdmin(profile);
          localStorage.setItem('adminData', JSON.stringify(profile));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      const { token: tkn, admin: adminData } = data;
      setToken(tkn);
      setAdmin(adminData);
      localStorage.setItem('adminToken', tkn);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      return data;
    } finally {
      setLoading(false);
    }
  };
  // Request a password reset email
  const resetPasswordRequest = async (email) => {
    try {
      setLoading(true);

      // api baseURL already includes `/api` so send only the route path
      const response = await api.post('/admin/forgot-password', { email });

      return response.data; // optional: return success data
    } catch (error) {
      console.error("Reset password request failed:", error);
      throw error; // let the caller handle the error
    } finally {
      setLoading(false);
    }
  };

  // Complete the password reset using the token
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);

      // post to the reset endpoint (baseURL already has /api)
      const response = await api.post('/admin/reset-password', {
        token,
        password,
      });

      return response.data;
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  return (
    <AdminContext.Provider value={{ admin, token, login, logout, loading , resetPassword, resetPasswordRequest}}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
};
