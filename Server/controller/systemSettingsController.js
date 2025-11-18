// import {supabase} from './'
import { supabase } from "../utils/supabaseClient.js";
export const saveSystemSettings = async (req, res) => {
  try {
    const payload = req.sanitized;
    

    // Make sure the payload includes the existing singleton row ID
    payload.id = 'e38df13b-390e-419a-9286-c01e5e1bd1ed';

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'id' })  // upsert will now update the existing row
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Settings saved successfully!',
      data
    });
  } catch (err) {
    console.error('Save error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save settings'
    });
  }
};

export const getSystemSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({
      success: true,
      data: data || {}
    });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
};

// Get registration fee (public endpoint)
export const getRegistrationFee = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('registration_fee_amount, registration_fee_currency')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({
      success: true,
      amount: data?.registration_fee_amount || 5000,
      currency: data?.registration_fee_currency || 'NGN'
    });
  } catch (err) {
    console.error('Fetch registration fee error:', err);
    return res.status(200).json({
      success: true,
      amount: 5000,
      currency: 'NGN'
    });
  }
};

// Update registration fee (admin only)
export const updateRegistrationFee = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    if (amount < 100 || amount > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be between 100 and 1,000,000'
      });
    }

    const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency'
      });
    }

    // Update or insert
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        id: 'e38df13b-390e-419a-9286-c01e5e1bd1ed',
        registration_fee_amount: amount,
        registration_fee_currency: currency,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Registration fee updated successfully',
      amount: data.registration_fee_amount,
      currency: data.registration_fee_currency
    });
  } catch (err) {
    console.error('Update registration fee error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update registration fee'
    });
  }
};