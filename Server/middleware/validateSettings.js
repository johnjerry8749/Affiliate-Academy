// src/middleware/validateSettings.js
export const validateSettings = (req, res, next) => {
  const {
    default_referral_commission,
    referral_commission_type,
    registration_fee_amount,
    registration_fee_currency,
    paystack_public_key,
    paystack_secret_key,
    wallet_address,
    wallet_name,
    wallet_amount,
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_password
  } = req.body;

  // Required fields
  if (!paystack_public_key?.trim()) {
    return res.status(400).json({ error: 'Paystack Public Key is required' });
  }
  if (!paystack_secret_key?.trim()) {
    return res.status(400).json({ error: 'Paystack Secret Key is required' });
  }

  // Type checks
  const commission = parseFloat(default_referral_commission);
  if (isNaN(commission) || commission < 0) {
    return res.status(400).json({ error: 'Invalid referral commission' });
  }

  // Validate registration fee
  const regFee = parseFloat(registration_fee_amount);
  if (registration_fee_amount && (isNaN(regFee) || regFee < 100 || regFee > 1000000)) {
    return res.status(400).json({ error: 'Registration fee must be between 100 and 1,000,000' });
  }

  const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
  if (registration_fee_currency && !validCurrencies.includes(registration_fee_currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  const port = parseInt(smtp_port, 10);
  if (smtp_port && (isNaN(port) || port < 1 || port > 65535)) {
    return res.status(400).json({ error: 'Invalid SMTP port' });
  }

  if (!['percentage', 'fixed'].includes(referral_commission_type)) {
    return res.status(400).json({ error: 'Invalid commission type' });
  }

  // Sanitize
  req.sanitized = {
    default_referral_commission: commission,
    referral_commission_type,
    registration_fee_amount: regFee || 5000,
    registration_fee_currency: registration_fee_currency || 'NGN',
    paystack_public_key: paystack_public_key.trim(),
    paystack_secret_key: paystack_secret_key.trim(),
    wallet_address: (wallet_address || '').trim(),
    wallet_name: (wallet_name || '').trim(),
    wallet_amount: wallet_amount,
    smtp_host: (smtp_host || '').trim(),
    smtp_port: port || 587,
    smtp_username: (smtp_username || '').trim(),
    smtp_password: smtp_password || '',
    updated_at: new Date().toISOString()
  };

  next();
};