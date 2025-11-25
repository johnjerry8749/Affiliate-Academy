// src/components/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider.jsx';
import { countries } from './userCountries.js';
import PaystackPayment from '../../payment/PaystackPayment.jsx';
import { getRegistrationFee } from '../../api/adminApi.js';
import './Register.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    country: '',
    paymentMethod: '',
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [loadingFee, setLoadingFee] = useState(true);
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refParam = searchParams.get('ref');
    if (refParam) setReferralCode(refParam);
  }, [location.search]);

  // Fetch registration fee from API
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const response = await getRegistrationFee();
        if (response.success) {
          setPaymentAmount(response.amount);
        }
      } catch (error) {
        console.error('Failed to fetch registration fee:', error);
        // Keep default of 5000 if fetch fails
      } finally {
        setLoadingFee(false);
      }
    };
    fetchFee();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'country') {
      const c = countries.find((x) => x.code === value);
      setSelectedCurrency(c ? c.currency : '');
    }
  };

  const proceedToPayment = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.phoneNumber.trim())
        throw new Error('Please fill out all required fields.');
      if (!formData.country) throw new Error('Please select your country.');
      if (!formData.paymentMethod) throw new Error('Please select a payment method.');
      if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match.');
      if (!formData.agreedToTerms) throw new Error('You must agree to the Terms and Conditions.');

      const safeEmail = formData.email.replace(/[@.]/g, '_');
      const timestamp = Date.now();
      const ref = `${safeEmail}_${timestamp}`;

      setPaymentRef(ref);
      setShowPaymentScreen(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (referenceObj) => {
    setLoading(true);
    setErrorMsg('');

    try {
      console.log(' Payment successful, processing registration...', referenceObj);

      // Register user first to get user_id
      const registrationData = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        paymentMethod: formData.paymentMethod,
        agreedToTerms: formData.agreedToTerms,
        paymentRef: referenceObj.reference,
        paid: true,
        referralCode: referralCode || null,
        role: 'user',
      });

      const newUserId = registrationData?.user?.id;

      if (!newUserId) {
        throw new Error('Registration failed - no user ID returned');
      }

      console.log('🔵 User registered. User ID:', newUserId, 'Referrer ID:', referralCode);

      // Verify payment with user_id and referrer_id
      console.log('🔄 Verifying payment with backend...');
      const verifyRes = await fetch(
        `${backendURL}/api/payment/verify/${referenceObj.reference}`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: newUserId,
            referrer_id: referralCode || null,
          })
        }
      );

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error('❌ Backend verification failed:', verifyRes.status, errorText);
        throw new Error(`Payment verification failed (${verifyRes.status})`);
      }

      const verifyData = await verifyRes.json();
      console.log('✅ Backend verification response:', verifyData);

      if (!verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed');
      }

      console.log('✅ Registration complete! Redirecting to login...');
      setShowPaymentScreen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('❌ Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      setShowPaymentScreen(false); // Close payment modal on error
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackClose = () => {
    setErrorMsg('Payment was cancelled.');
    setShowPaymentScreen(false);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <Link to="/" className="back-to-home">
          <i className="bi bi-arrow-left"></i>
          <span>Back to Home</span>
        </Link>

        {!showPaymentScreen && (
          <div className="register-card">
            <div className="register-header">
              <div className="logo-section"><i className="bi bi-person-plus"></i></div>
              <h1>Create Account</h1>
              <p>Join Affiliate Academy and start your journey</p>
            </div>

            {referralCode && (
              <div className="alert alert-success d-flex align-items-center">
                <i className="bi bi-gift me-2"></i>
                <div>
                  <strong>Referral Bonus!</strong><br />
                  <small>Complete registration to earn rewards!</small>
                </div>
              </div>
            )}

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <form onSubmit={proceedToPayment} className="register-form">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <div className="input-wrapper">
                  <i className="bi bi-telephone"></i>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    minLength="8"
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock-fill"></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                    minLength="8"
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className="form-group">
                <label htmlFor="country">Select Country</label>
                <div className="input-wrapper">
                  <i className="bi bi-globe"></i>
                  <select id="country" name="country" value={formData.country} onChange={handleChange} required>
                    <option value="">Choose your country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {selectedCurrency && (
                  <div className="currency-display">
                    <i className="bi bi-currency-exchange"></i>
                    <span>Currency: {selectedCurrency}</span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <div className="input-wrapper">
                  <i className="bi bi-credit-card"></i>
                  <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                    <option value="">Choose payment method</option>
                    <option value="paystack">Paystack (Card, Bank, USSD)</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>

              {/* Terms */}
              <div className="form-group">
                <div className="terms-checkbox">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="agreedToTerms">
                    I agree to the <Link to="/terms" className="terms-link">Terms</Link> and <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                  </label>
                </div>
              </div>

              <button type="submit" className="register-button" disabled={loading}>
                {loading ? 'Preparing…' : <>Proceed to Payment <i className="bi bi-arrow-right"></i></>}
              </button>
            </form>

            <div className="divider"><span>or</span></div>
            <div className="login-link">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </div>
        )}

        {showPaymentScreen && (
          <div className="payment-screen">
            <div className="payment-card">
              <h2>Complete Your Payment</h2>
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              {formData.paymentMethod === 'paystack' && (
                <PaystackPayment
                  amount={paymentAmount}
                  email={formData.email}
                  reference={paymentRef}
                  onSuccess={handlePaystackSuccess}
                  onClose={handlePaystackClose}
                />
              )}

              {formData.paymentMethod === 'crypto' && (
                <div className="crypto-placeholder">
                  <p>Crypto payment selected</p>
                  <button 
                    className="register-button" 
                    onClick={() => {
                      // Store in sessionStorage for persistence
                      const registrationData = {
                        fullName: formData.fullName,
                        email: formData.email,
                        password: formData.password,
                        phoneNumber: formData.phoneNumber,
                        country: formData.country,
                        paymentMethod: 'crypto',
                        paymentRef,
                        referralCode: referralCode || null,
                        agreedToTerms: formData.agreedToTerms
                      };
                      sessionStorage.setItem('cryptoRegistrationData', JSON.stringify(registrationData));
                      navigate('/crypto-payment', {
                        state: { registrationData }
                      });
                    }}
                    type="button"
                  >
                    Proceed to Crypto Payment <i className="bi bi-arrow-right"></i>
                  </button>
                  <button 
                    className="btn btn-secondary mt-3" 
                    onClick={() => setShowPaymentScreen(false)}
                    type="button"
                  >
                    <i className="bi bi-arrow-left"></i> Back to Form
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;