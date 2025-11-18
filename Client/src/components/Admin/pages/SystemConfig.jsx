// import React, { useState, useEffect } from 'react';
// import AdminSidebar from '../adminLayout/AdminSidebar';
// import Smallfooter from '../../Users/UserLayout/smallfooter';
// import { supabase } from '../../../../supabase';

// const SystemConfig = () => {
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const [settings, setSettings] = useState({
//     // Referral Settings
//     default_referral_commission: '',
//     referral_commission_type: 'percentage',

//     // Payment Settings
//     paystack_public_key: '',
//     paystack_secret_key: '',

//     // Wallet Settings
//     wallet_address: '',
//     wallet_name: '',

//     // Email Settings
//     smtp_host: '',
//     smtp_port: '',
//     smtp_username: '',
//     smtp_password: ''
//   });

//   // Live Alert Function
//   const showLiveAlert = (message, type = 'success') => {
//     const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
//     if (!alertPlaceholder) return;

//     const wrapper = document.createElement('div');
//     wrapper.innerHTML = `
//       <div class="alert alert-${type} alert-dismissible fade show" role="alert">
//         <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
//         ${message}
//         <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
//       </div>
//     `;

//     alertPlaceholder.append(wrapper);

//     setTimeout(() => {
//       wrapper.remove();
//     }, 5000);
//   };

//   useEffect(() => {
//     const handleResize = () => setWindowWidth(window.innerWidth);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     fetchSettings();

//     const checkSidebarState = () => {
//       const sidebar = document.querySelector('.admin-sidebar');
//       if (sidebar) {
//         setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
//       }
//     };

//     checkSidebarState();

//     const sidebar = document.querySelector('.admin-sidebar');
//     if (sidebar) {
//       const observer = new MutationObserver(checkSidebarState);
//       observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

//       return () => observer.disconnect();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const fetchSettings = async () => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase
//         .from('system_settings')
//         .select('*')
//         .single();

//       if (error && error.code !== 'PGRST116') throw error;

//       if (data) {
//         setSettings({
//           default_referral_commission: data.default_referral_commission?.toString() || '',
//           referral_commission_type: data.referral_commission_type || 'percentage',
//           paystack_public_key: data.paystack_public_key || '',
//           paystack_secret_key: data.paystack_secret_key || '',
//           wallet_address: data.wallet_address || '',
//           wallet_name: data.wallet_name || '',
//           smtp_host: data.smtp_host || '',
//           smtp_port: data.smtp_port?.toString() || '',
//           smtp_username: data.smtp_username || '',
//           smtp_password: data.smtp_password || ''
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching settings:', error);
//       showLiveAlert('Failed to load settings', 'danger');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setSettings(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSaveSettings = async (e) => {
//     e.preventDefault();

//     try {
//       setSaving(true);

//       const settingsData = {
//         default_referral_commission: parseFloat(settings.default_referral_commission) || 0,
//         referral_commission_type: settings.referral_commission_type,
//         paystack_public_key: settings.paystack_public_key,
//         paystack_secret_key: settings.paystack_secret_key,
//         wallet_address: settings.wallet_address,
//         wallet_name: settings.wallet_name,
//         smtp_host: settings.smtp_host,
//         smtp_port: parseInt(settings.smtp_port) || 587,
//         smtp_username: settings.smtp_username,
//         smtp_password: settings.smtp_password,
//         updated_at: new Date().toISOString()
//       };

//       // Check if settings exist
//       const { data: existingSettings } = await supabase
//         .from('system_settings')
//         .select('id')
//         .single();

//       let error;
//       if (existingSettings) {
//         // Update existing settings
//         const result = await supabase
//           .from('system_settings')
//           .update(settingsData)
//           .eq('id', existingSettings.id);
//         error = result.error;
//       } else {
//         // Insert new settings
//         const result = await supabase
//           .from('system_settings')
//           .insert([settingsData]);
//         error = result.error;
//       }

//       if (error) throw error;

//       showLiveAlert('Settings saved successfully!', 'success');
//     } catch (error) {
//       console.error('Error saving settings:', error);
//       showLiveAlert('Failed to save settings: ' + error.message, 'danger');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       <div className="admin-layout d-flex">
//         <AdminSidebar />

//         <div 
//           id="liveAlertPlaceholder" 
//           style={{
//             position: 'fixed',
//             top: '20px',
//             right: '20px',
//             zIndex: 10000,
//             minWidth: '300px'
//           }}
//         ></div>

//         <div 
//           className="main-content flex-grow-1 p-3 p-md-4"
//           style={{
//             marginLeft: windowWidth <= 768 ? '0' : (isSidebarCollapsed ? '80px' : '250px'),
//             transition: 'margin-left 0.3s ease',
//             minHeight: '100vh',
//             backgroundColor: '#f8f9fa',
//             overflowX: 'hidden'
//           }}
//         >
//           <div className="mb-4 mt-5">
//             <h2 className="mb-2 fw-bold">
//               <i className="bi bi-gear me-2 text-primary"></i>
//               System Configuration
//             </h2>
//             <p className="text-muted mb-0">Manage system settings and configurations</p>
//           </div>

//           {loading ? (
//             <div className="text-center py-5">
//               <div className="spinner-border text-primary" role="status">
//                 <span className="visually-hidden">Loading...</span>
//               </div>
//               <p className="mt-3 text-muted">Loading settings...</p>
//             </div>
//           ) : (
//             <form onSubmit={handleSaveSettings}>
//               {/* Referral Settings Section */}
//               <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
//                 <div className="card-body">
//                   <h5 className="fw-bold text-dark mb-4">
//                     <i className="bi bi-diagram-3 me-2 text-primary"></i>
//                     Referral Commission Configuration
//                   </h5>
//                   <div className="row g-3">
//                     <div className="col-md-12">
//                       <label className="form-label fw-bold text-dark">
//                         Default Referral Commission
//                       </label>
//                       <input
//                         type="number"
//                         className="form-control"
//                         name="default_referral_commission"
//                         value={settings.default_referral_commission}
//                         onChange={handleInputChange}
//                         placeholder="e.g., 10"
//                         step="0.01"
//                       />
//                       <small className="text-muted">
//                         Commission earned when user registers through referral link
//                       </small>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Settings Section */}
//               <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
//                 <div className="card-body">
//                   <h5 className="fw-bold text-dark mb-3">
//                     <i className="bi bi-credit-card-2-front me-2 text-primary"></i>
//                     Paystack Integration
//                   </h5>
//                   <div className="alert alert-info">
//                     <i className="bi bi-info-circle me-2"></i>
//                     Get your Paystack API keys from your 
//                     <a href="https://dashboard.paystack.com/#/settings/developers" target="_blank" rel="noopener noreferrer" className="ms-1">
//                       Paystack Dashboard
//                     </a>
//                   </div>
//                   <div className="row g-3">
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold text-dark">
//                         Paystack Public Key
//                       </label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         name="paystack_public_key"
//                         value={settings.paystack_public_key}
//                         onChange={handleInputChange}
//                         placeholder="pk_test_xxxxxxxxxxxxxxxx or pk_live_xxxxxxxxxxxxxxxx"
//                       />
//                       <small className="text-muted">
//                         Your Paystack public key (starts with pk_)
//                       </small>
//                     </div>

//                     <div className="col-md-6">
//                       <label className="form-label fw-bold text-dark">
//                         Paystack Secret Key
//                       </label>
//                       <input
//                         type="password"
//                         className="form-control"
//                         name="paystack_secret_key"
//                         value={settings.paystack_secret_key}
//                         onChange={handleInputChange}
//                         placeholder="sk_test_xxxxxxxxxxxxxxxx or sk_live_xxxxxxxxxxxxxxxx"
//                       />
//                       <small className="text-muted">
//                         Your Paystack secret key (starts with sk_) - Keep this secure!
//                       </small>
//                     </div>

//                     <div className="col-12">
//                       <div className="alert alert-warning mb-0">
//                         <i className="bi bi-exclamation-triangle me-2"></i>
//                         <strong>Security Notice:</strong> Never share your secret key publicly. 
//                         Always use environment variables in production.
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               {/*User Wallet Address Crypto Payment*/}


//               {/* Email Settings Section */}
//               <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
//                 <div className="card-body">
//                   <h5 className="fw-bold text-dark mb-3">
//                     <i className="bi bi-wallet2 me-2 text-primary"></i>
//                     User Wallet Address
//                   </h5>
//                   <div className="alert alert-info">
//                     <i className="bi bi-info-circle me-2"></i>
//                     Users can receive payments in their crypto wallets.
//                   </div>
//                   <div className="row g-3">
//                     <div className="col-md-6">
//                       <label className="form-label fw-bold text-dark">
//                         Wallet Name
//                       </label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         name="wallet_name"
//                         value={settings.wallet_name}
//                         onChange={handleInputChange}
//                         placeholder="e.g., USDT TRC20"
//                       />
//                       <small className="text-muted">
//                         Name/Type of the wallet (e.g., Bitcoin, Ethereum, USDT)
//                       </small>
//                     </div>

//                     <div className="col-md-6">
//                       <label className="form-label fw-bold text-dark">
//                         Wallet Address
//                       </label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         name="wallet_address"
//                         value={settings.wallet_address}
//                         onChange={handleInputChange}
//                         placeholder="Enter your wallet address"
//                       />
//                       <small className="text-muted">
//                         Your cryptocurrency wallet address
//                       </small>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Save Button */}
//               <div className="text-end mb-4">
//                 <button
//                   type="submit"
//                   className="btn btn-primary btn-lg px-5"
//                   disabled={saving}
//                 >
//                   {saving ? (
//                     <>
//                       <span className="spinner-border spinner-border-sm me-2"></span>
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <i className="bi bi-save me-2"></i>
//                       Save All Settings
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           )}

//           <Smallfooter />
//         </div>
//       </div>
//     </>
//   );
// }

// export default SystemConfig;

import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';
import { supabase } from '../../../../supabase';
import { getSystemSettings, saveSystemSettings } from '../../../api/adminApi';
const token = localStorage.getItem('adminToken');

const SystemConfig = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    default_referral_commission: '',
    referral_commission_type: 'percentage',
    registration_fee_amount: '',
    registration_fee_currency: 'NGN',
    paystack_public_key: '',
    paystack_secret_key: '',
    wallet_address: '',
    wallet_name: '',
    wallet_amount: '', // <-- new
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: ''
  });

  /* ------------------------------------------------- */
  /*  Live Alert (unchanged)                           */
  /* ------------------------------------------------- */
  const showLiveAlert = (message, type = 'success') => {
    const placeholder = document.getElementById('liveAlertPlaceholder');
    if (!placeholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    placeholder.append(wrapper);
    setTimeout(() => wrapper.remove(), 5000);
  };

  /* ------------------------------------------------- */
  /*  Resize + Sidebar detection (unchanged)          */
  /* ------------------------------------------------- */
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSettings();

    const checkSidebar = () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
    };
    checkSidebar();

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebar);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  /* ------------------------------------------------- */
  /*  FETCH SETTINGS                                   */
  /* ------------------------------------------------- */

  const fetchSettings = async () => {
    try {
      setLoading(true);

      if (!token) {
        showLiveAlert('No token found, please login', 'danger');
        return;
      }

      // Call backend API
      const res = await getSystemSettings(token);

      if (res.success && res.data) {
        const data = res.data;
        setSettings({
          default_referral_commission: data.default_referral_commission?.toString() || '',
          referral_commission_type: data.referral_commission_type || 'percentage',
          registration_fee_amount: data.registration_fee_amount?.toString() || '5000',
          registration_fee_currency: data.registration_fee_currency || 'NGN',
          paystack_public_key: data.paystack_public_key || '',
          paystack_secret_key: data.paystack_secret_key || '',
          wallet_address: data.wallet_address || '',
          wallet_name: data.wallet_name || '',
          wallet_amount: data.wallet_amount,
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port?.toString() || '',
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || ''
        });
      } else {
        showLiveAlert('Failed to load settings', 'danger');
      }

    } catch (err) {
      console.error('Fetch error:', err);
      showLiveAlert(err.message || 'Failed to load settings', 'danger');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------- */
  /*  INPUT CHANGE                                     */
  /* ------------------------------------------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  /* ------------------------------------------------- */
  /*  SAVE SETTINGS – **UPSERT** (the magic)           */
  /* ------------------------------------------------- */
  const handleSaveSettings = async (e) => {
    e.preventDefault(); // important to prevent default form submission

    try {
      setSaving(true);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        showLiveAlert('No admin token found. Please login.', 'danger');
        return;
      }

      // Prepare payload
      const payload = {
        default_referral_commission: parseFloat(settings.default_referral_commission) || 0,
        referral_commission_type: settings.referral_commission_type,
        registration_fee_amount: parseFloat(settings.registration_fee_amount) || 5000,
        registration_fee_currency: settings.registration_fee_currency,
        paystack_public_key: settings.paystack_public_key.trim(),
        paystack_secret_key: settings.paystack_secret_key.trim(),
        wallet_address: settings.wallet_address.trim(),
        wallet_name: settings.wallet_name.trim(),
        wallet_amount: parseFloat(settings.wallet_amount) || 0, 
        smtp_host: settings.smtp_host.trim(),
        smtp_port: parseInt(settings.smtp_port, 10) || 587,
        smtp_username: settings.smtp_username.trim(),
        smtp_password: settings.smtp_password,
        updated_at: new Date().toISOString()
      };

      // Call backend API instead of Supabase directly
      const res = await saveSystemSettings(token, payload);

      if (res.success) {
        showLiveAlert(res.message || 'Settings saved successfully!', 'success');
      } else {
        showLiveAlert(res.error || 'Failed to save settings', 'danger');
      }

    } catch (err) {
      console.error('Save error:', err);
      showLiveAlert(err.message || 'Failed to save settings', 'danger');
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------- */
  /*  RENDER                                           */
  /* ------------------------------------------------- */
  return (
    <>
      <div className="admin-layout d-flex">
        <AdminSidebar />

        <div
          id="liveAlertPlaceholder"
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000, minWidth: 300 }}
        ></div>

        <div
          className="main-content flex-grow-1 p-3 p-md-4"
          style={{
            marginLeft: windowWidth <= 768 ? 0 : isSidebarCollapsed ? 80 : 250,
            transition: 'margin-left .3s ease',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            overflowX: 'hidden'
          }}
        >
          <div className="mb-4 mt-5">
            <h2 className="mb-2 fw-bold">
              <i className="bi bi-gear me-2 text-primary"></i>
              System Configuration
            </h2>
            <p className="text-muted mb-0">Manage system settings and configurations</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading settings...</p>
            </div>
          ) : (
            /* ------------------------------------------------- */
            /*  FORM – **type="submit"** on the button          */
            /* ------------------------------------------------- */
            <form onSubmit={handleSaveSettings} noValidate>
              {/* ---------- Referral Section ---------- */}
              <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
                <div className="card-body">
                  <h5 className="fw-bold text-dark mb-4">
                    <i className="bi bi-diagram-3 me-2 text-primary"></i>
                    Referral Commission Configuration
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold text-dark">
                        Default Referral Commission
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="default_referral_commission"
                        value={settings.default_referral_commission}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                      />
                      <small className="text-muted">
                        Commission earned when a user registers through a referral link
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- Registration Fee Section ---------- */}
              <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
                <div className="card-body">
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-cash-coin me-2 text-primary"></i>
                    Registration Fee Settings
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Registration Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="registration_fee_amount"
                        value={settings.registration_fee_amount}
                        onChange={handleInputChange}
                        placeholder="5000"
                        min="100"
                        max="1000000"
                      />
                      <small className="text-muted">Amount users pay to register (100 - 1,000,000)</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Currency</label>
                      <select
                        className="form-select"
                        name="registration_fee_currency"
                        value={settings.registration_fee_currency}
                        onChange={handleInputChange}
                      >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- Paystack Section ---------- */}
              <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
                <div className="card-body">
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-credit-card-2-front me-2 text-primary"></i>
                    Paystack Integration
                  </h5>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Get your Paystack API keys from your{' '}
                    <a
                      href="https://dashboard.paystack.com/#/settings/developers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-1"
                    >
                      Paystack Dashboard
                    </a>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Paystack Public Key</label>
                      <input
                        type="text"
                        className="form-control"
                        name="paystack_public_key"
                        value={settings.paystack_public_key}
                        onChange={handleInputChange}
                        placeholder="pk_test_… or pk_live_…"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Paystack Secret Key</label>
                      <input
                        type="password"
                        className="form-control"
                        name="paystack_secret_key"
                        value={settings.paystack_secret_key}
                        onChange={handleInputChange}
                        placeholder="sk_test_… or sk_live_…"
                      />
                    </div>

                    <div className="col-12">
                      <div className="alert alert-warning mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Security Notice:</strong> Never share your secret key publicly.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- Wallet Section ---------- */}
              <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
                <div className="card-body">
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-wallet2 me-2 text-primary"></i>
                    User Wallet Address
                  </h5>
                  <div className="row g-3">
                    {/* Wallet Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Wallet Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="wallet_name"
                        value={settings.wallet_name}
                        onChange={handleInputChange}
                        placeholder="e.g., USDT TRC20"
                      />
                    </div>

                    {/* Wallet Address */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Wallet Address</label>
                      <input
                        type="text"
                        className="form-control"
                        name="wallet_address"
                        value={settings.wallet_address}
                        onChange={handleInputChange}
                        placeholder="Enter your wallet address"
                      />
                    </div>

                    {/* Amount to be Paid */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Amount to be Paid</label>
                      <input
                        type="number"
                        className="form-control"
                        name="wallet_amount"
                        value={settings.wallet_amount || ''}
                        onChange={handleInputChange}
                        placeholder="Enter amount in USD"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- Email Settings (SMTP) ---------- */}
              <div className="card shadow-sm mb-4" style={{ backgroundColor: 'white' }}>
                <div className="card-body">
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    SMTP Email Settings
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">SMTP Host</label>
                      <input
                        type="text"
                        className="form-control"
                        name="smtp_host"
                        value={settings.smtp_host}
                        onChange={handleInputChange}
                        placeholder="e.g., smtp.gmail.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">SMTP Port</label>
                      <input
                        type="number"
                        className="form-control"
                        name="smtp_port"
                        value={settings.smtp_port}
                        onChange={handleInputChange}
                        placeholder="587"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">SMTP Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="smtp_username"
                        value={settings.smtp_username}
                        onChange={handleInputChange}
                        placeholder="your-email@example.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">SMTP Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="smtp_password"
                        value={settings.smtp_password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- SAVE BUTTON ---------- */}
              <div className="text-end mb-4">
                <button
                  type="submit"               // <-- makes Enter key work
                  className="btn btn-primary btn-lg px-5"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      Save All Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <Smallfooter />
        </div>
      </div>
    </>
  );
};

export default SystemConfig;