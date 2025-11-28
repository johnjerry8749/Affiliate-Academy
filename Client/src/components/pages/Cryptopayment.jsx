import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../supabase';
import { useAuth } from '../../context/AuthProvider';


const Cryptopayment = () => {
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletAmount, setWalletAmount] = useState(0)
  const [copied, setCopied] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Get registration data from state or sessionStorage
  const getRegistrationData = () => {
    const stateData = location.state?.registrationData;
    if (stateData) return stateData;
    
    const stored = sessionStorage.getItem('cryptoRegistrationData');
    return stored ? JSON.parse(stored) : null;
  };
  
  const userData = getRegistrationData();

  console.log('Registration data:', userData)


  // Live Alert Function
  const showLiveAlert = (message, type = 'success') => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'danger' ? 'exclamation-triangle-fill' : 'info-circle-fill'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    alertPlaceholder.append(wrapper);

    setTimeout(() => {
      wrapper.remove();
    }, 5000);
  };

  // Fetch wallet details from system settings
  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('system_settings')
          .select('wallet_name, wallet_address, wallet_amount ')
          .single()
        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setWalletName(data.wallet_name || 'Crypto Wallet');
          setWalletAddress(data.wallet_address || '');
          setWalletAmount(data.wallet_amount || 0);
        } else {
          // No settings found - show message
          showLiveAlert('Wallet information not configured yet. Please contact admin.', 'warning');
        }
      } catch (error) {
        console.error('Error fetching wallet details:', error);
        showLiveAlert('Failed to load wallet information. Please try again.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletDetails();
  }, []);

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showLiveAlert('Please select an image file', 'warning');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showLiveAlert('File size must be less than 5MB', 'warning');
        return;
      }

      setPaymentProof(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setPaymentProof(null);
    setPreviewUrl('');
  };



  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!paymentProof) {
  //     showLiveAlert('Upload proof', 'warning');
  //     return;
  //   }

  //   try {
  //     setSubmitting(true);

  //     // 1. Upload to crypto_payment bucket
  //     const fileExt = paymentProof.name.split('.').pop();
  //     const fileName = `${Date.now()}.${fileExt}`;
  //     const filePath = `pending/${Date.now()}-${fileName}`;

  //     const { error: uploadError } = await supabase.storage
  //       .from('crypto_payment') // ← YOUR BUCKET
  //       .upload(filePath, paymentProof, { upsert: false });

  //     if (uploadError) throw uploadError;

  //     // 2. Get public URL
  //     const { data: urlData } = supabase.storage
  //       .from('crypto_payment')
  //       .getPublicUrl(filePath);

  //     // 3. Save to crypto_payments
  //     const { error: insertError } = await supabase
  //       .from('crypto_payments')
  //       .insert({
  //         user_id: uuidv4(),
  //         wallet_name: walletName,
  //         wallet_address: walletAddress,
  //         payment_proof_url: urlData.publicUrl,
  //         status: 'pending',
  //         created_at: new Date().toISOString(),
  //       });

  //     if (insertError) throw insertError;

  //     showLiveAlert('Proof submitted! We’ll verify in 24h.', 'success');
  //     setTimeout(() => navigate('/'), 2000);
  //   } catch (err) {
  //     console.error('Submit error:', err);
  //     showLiveAlert('Failed. Try again.', 'danger');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentProof) {
      showLiveAlert('Please upload payment proof', 'warning');
      return;
    }

    if (!userData) {
      showLiveAlert('User data missing. Please go back and try again.', 'danger');
      return;
    }

    try {
      setSubmitting(true);

      // STEP 1: Register the user with paid = false (pending)
    // Make sure useAuth is providing register function
      const registrationResponse = await register({
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        country: userData.country,
        paymentMethod: 'crypto',
        agreedToTerms: userData.agreedToTerms,
        referralCode: userData.referralCode || null,
        paid: false, // Important: pending payment
        role: 'user',
      });
      console.log(registrationResponse)

      const newUserId = registrationResponse?.user?.id;

      if (!newUserId) {
        throw new Error('Failed to create user account');
      }

      // STEP 2: Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${Date.now()}-${newUserId}.${fileExt}`;
      const filePath = `pending/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('crypto_payment')
        .upload(filePath, paymentProof, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('crypto_payment')
        .getPublicUrl(filePath);

      // STEP 3: Save receipt with REAL user_id
      const { error: insertError } = await supabase
        .from('crypto_payments')
        .insert({
          user_id: newUserId,                    // ← NOW USING REAL USER ID
          wallet_name: walletName,
          wallet_address: walletAddress,
          // amount: walletAmount,
          payment_proof_url: urlData.publicUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to save payment proof');
      }

      // STEP 4: Send notification email to admin
      try {
        const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const apiURL = backendURL.endsWith('/api') ? backendURL : `${backendURL}/api`;
        
        const adminResponse = await fetch(`${apiURL}/mail/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: import.meta.env.VITE_ADMIN_EMAIL || 'affiliateacademy89@gmail.com',
            subject: '🔔 New Crypto Payment Proof Uploaded',
            message: `A new user has uploaded their crypto payment proof and is awaiting approval.
            
            User Details:
            📧 Email: ${userData.email}
            👤 Full Name: ${userData.fullName}
            📱 Phone: ${userData.phoneNumber}
            🌍 Country: ${userData.country}
            
            Payment Details:
            💳 Wallet: ${walletName}
            📍 Wallet Address: ${walletAddress}
            
            Please review and approve/reject this payment in the admin dashboard as soon as possible.
            
            View Payment Proof: ${urlData.publicUrl}`,
            name: 'Admin Team'
          })
        });

        if (adminResponse.ok) {
          console.log('✅ Admin notification sent');
        }
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the submission if email fails
      }

      // Success!
      showLiveAlert('Payment proof submitted successfully! Awaiting approval (24-48 hrs)', 'success');
      
      // Clear sessionStorage
      sessionStorage.removeItem('cryptoRegistrationData');

      // Sign out the user since they cannot login until approved
      await supabase.auth.signOut();

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Registration complete! Your crypto payment is under review. You will receive an email when approved.' }
        });
      }, 3000);

    } catch (err) {
      console.error('Crypto payment submission failed:', err);
      showLiveAlert(err.message || 'Submission failed. Please try again.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)' }}>
        <div className="text-center text-white">
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5">Loading wallet information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3"
      style={{
        background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
        position: 'relative'
      }}>

      {/* Background Pattern */}
      <div style={{
        content: '',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        pointerEvents: 'none'
      }}></div>

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

      <div className="container" style={{ maxWidth: '700px', position: 'relative', zIndex: 1 }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-link text-white text-decoration-none mb-3 p-0 d-inline-flex align-items-center"
          style={{ fontSize: '0.95rem', fontWeight: 500, gap: '8px' }}
        >
          <i className="bi bi-arrow-left"></i>
          Back
        </button>

        {/* Main Card */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
          <div className="card-body p-4 p-md-5">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle mb-3"
                style={{ width: '70px', height: '70px' }}>
                <i className="bi bi-coin text-success" style={{ fontSize: '2rem' }}></i>
              </div>
              <h2 className="fw-bold mb-2">Cryptocurrency Payment</h2>
              <p className="text-muted mb-0">Complete your payment using cryptocurrency</p>
            </div>

            {/* Alert */}
            <div className="alert alert-info d-flex align-items-start mb-4">
              <i className="bi bi-info-circle-fill me-2 mt-1 flex-shrink-0"></i>
              <div>
                <strong>Important:</strong> Send the exact payment amount to the wallet address below and upload your payment proof.
              </div>
            </div>

            {/* Wallet Information */}
            <div className="bg-light rounded-3 p-4 mb-4">
              {/* Wallet Name */}
              <div className="d-inline-block bg-success text-white px-3 py-2 rounded-pill mb-3">
                <i className="bi bi-wallet2 me-2"></i>
                <strong>{walletName}</strong>
              </div>

              {/* Wallet Amount */}
              <div className="mb-3 d-flex justify-content-center ">
                <span className="badge bg-success fs-6" >
                  Amount: $ {parseFloat(walletAmount || 0).toFixed(2)}
                </span>
              </div>

              {/* Wallet Address */}
              <div className="mb-3">
                <label className="form-label fw-bold">Wallet Address</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-white"
                    value={walletAddress}
                    readOnly
                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    className={`btn ${copied ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={copyToClipboard}
                  >
                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <small className="text-muted d-block mt-1">
                  Click the copy button to copy the wallet address
                </small>
              </div>
            </div>


            {/* Payment Form */}
            <form onSubmit={handleSubmit}>
              <h5 className="fw-bold mb-3 pb-2 border-bottom">
                <i className="bi bi-upload me-2 text-success"></i>
                Submit Payment Proof
              </h5>

              {/* Upload Payment Proof */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Payment Proof (Screenshot) <span className="text-danger">*</span>
                </label>

                {!paymentProof ? (
                  <div
                    className="border border-2 border-dashed rounded-3 p-5 text-center bg-light"
                    style={{ cursor: 'pointer', borderColor: '#dee2e6' }}
                    onClick={() => document.getElementById('paymentProof').click()}
                  >
                    <input
                      type="file"
                      id="paymentProof"
                      accept="image/*"
                      onChange={handleFileChange}
                      hidden
                    />
                    <i className="bi bi-cloud-upload text-success d-block mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="fw-semibold mb-1">Click to upload payment screenshot</p>
                    <small className="text-muted">PNG, JPG, JPEG (Max 5MB)</small>
                  </div>
                ) : (
                  <div className="position-relative border rounded-3 overflow-hidden">
                    {/* <img src={previewUrl} alt="Payment Proof" className="w-100"  /> */}
                    {previewUrl && (
                      <img src={previewUrl} alt="Payment Proof" className="w-100"
                        style={{ maxHeight: '400px', objectFit: 'contain', background: '#f5f5f5' }} />
                    )}

                    <button
                      type="button"
                      className="btn btn-danger position-absolute top-0 end-0 m-2"
                      onClick={removeFile}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="alert alert-warning d-flex align-items-start mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1 flex-shrink-0"></i>
                <div>
                  <strong>Before submitting:</strong>
                  <ul className="mb-0 mt-2 ps-3">
                    <li>Ensure you've sent the payment to the correct wallet address</li>
                    <li>Upload a clear screenshot of your transaction</li>
                    <li>Payment verification may take 24-48 hours</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={submitting || !paymentProof}
                  style={{
                    background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Submit Payment Proof
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; export default Cryptopayment;