// controllers/cryptoPaymentController.js
import { supabase } from '../utils/supabaseClient.js';

export const updateCryptoPaymentStatus = async (req, res) => {
  const { payment_id, status } = req.body;

  if (!payment_id || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid payment_id or status' });
  }

  try {
    // 1. Fetch payment to get user_id
    const { data: payment, error: fetchError } = await supabase
      .from('crypto_payments')
      .select('user_id, status')
      .eq('id', payment_id)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === status) {
      return res.status(400).json({ error: `Payment already ${status}` });
    }

    // 2. Update crypto_payments
    const { error: updateError } = await supabase
      .from('crypto_payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id);

    if (updateError) throw updateError;

    // 3. If APPROVED → Activate user (bypasses RLS!)
    if (status === 'approved') {
      const { error: userError } = await supabase
        .from('users')
        .update({
          paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userError) throw userError;

      // Optional: Trigger welcome email
      // sendWelcomeEmail(payment.user_id);
    }

    res.json({
      success: true,
      message: `Payment ${status}! User ${status === 'approved' ? 'activated' : 'not activated'}.`,
    });
  } catch (error) {
    console.error('Update failed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};