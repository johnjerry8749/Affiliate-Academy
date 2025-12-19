/**
 * Referral Commission Service
 * Handles referral commission processing with automatic currency conversion
 */

import { supabase } from '../utils/supabaseClient.js';
import { convertReferralCommission, formatCurrency } from './currencyService.js';

/**
 * Process referral commission with automatic currency conversion
 * Call this after a successful payment to credit the referrer
 * 
 * @param {Object} options - Commission options
 * @param {string} options.referrerId - UUID of the referrer
 * @param {string} options.referredId - UUID of the new user who was referred
 * @param {number} options.commissionAmount - Commission amount in payment currency
 * @param {string} options.paymentCurrency - Currency of the payment (e.g., 'NGN')
 * @param {string} options.commissionType - Type of commission (e.g., 'registration', 'purchase')
 * @returns {Promise<Object>} - Result of the operation
 */
async function processReferralCommission({
  referrerId,
  referredId,
  commissionAmount,
  paymentCurrency,
  commissionType = 'registration'
}) {
  console.log('=== Processing Referral Commission ===');
  console.log(`Referrer: ${referrerId}`);
  console.log(`Referred: ${referredId}`);
  console.log(`Amount: ${commissionAmount} ${paymentCurrency}`);

  try {
    // Step 1: Get the referrer's currency from their profile or balance
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('currency, full_name')
      .eq('id', referrerId)
      .single();

    if (referrerError || !referrerData) {
      throw new Error(`Referrer not found: ${referrerError?.message || 'No data'}`);
    }

    const referrerCurrency = referrerData.currency || 'USD';
    console.log(`Referrer currency: ${referrerCurrency}`);

    // Step 2: Convert commission to referrer's currency
    let finalCommissionAmount = commissionAmount;
    let conversionDetails = null;

    if (paymentCurrency !== referrerCurrency) {
      console.log(`Converting ${paymentCurrency} → ${referrerCurrency}`);
      
      const conversion = await convertReferralCommission(
        commissionAmount,
        paymentCurrency,
        referrerCurrency
      );

      if (!conversion.success) {
        throw new Error(`Currency conversion failed: ${conversion.error}`);
      }

      finalCommissionAmount = conversion.convertedAmount;
      conversionDetails = conversion;
      
      console.log(`Converted: ${formatCurrency(commissionAmount, paymentCurrency)} → ${formatCurrency(finalCommissionAmount, referrerCurrency)}`);
    } else {
      console.log('No conversion needed - same currency');
    }

    // Step 3: Get referrer's current balance
    const { data: currentBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('available_balance, total_earned')
      .eq('user_id', referrerId)
      .single();

    if (balanceError) {
      throw new Error(`Failed to get referrer balance: ${balanceError.message}`);
    }

    // Step 4: Update referrer's balance
    const newAvailableBalance = (parseFloat(currentBalance.available_balance) || 0) + finalCommissionAmount;
    const newTotalEarned = (parseFloat(currentBalance.total_earned) || 0) + finalCommissionAmount;

    const { error: updateError } = await supabase
      .from('user_balances')
      .update({
        available_balance: newAvailableBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', referrerId);

    if (updateError) {
      throw new Error(`Failed to update referrer balance: ${updateError.message}`);
    }

    console.log(`Balance updated: ${formatCurrency(newAvailableBalance, referrerCurrency)}`);

    // Step 5: Record the commission transaction
    const commissionRecord = {
      referrer_id: referrerId,
      referred_id: referredId,
      amount: finalCommissionAmount,
      currency: referrerCurrency,
      original_amount: commissionAmount,
      original_currency: paymentCurrency,
      exchange_rate: conversionDetails?.exchangeRate || 1,
      commission_type: commissionType,
      created_at: new Date().toISOString()
    };

    // Try to insert into referral_commissions table (optional - may not exist)
    try {
      await supabase.from('referral_commissions').insert(commissionRecord);
      console.log('Commission record saved');
    } catch (e) {
      console.log('Note: Could not save to referral_commissions table (table may not exist)');
    }

    // Step 6: Return success result
    return {
      success: true,
      message: `Commission credited successfully`,
      details: {
        referrerId,
        referredId,
        referrerName: referrerData.full_name,
        originalAmount: commissionAmount,
        originalCurrency: paymentCurrency,
        creditedAmount: finalCommissionAmount,
        creditedCurrency: referrerCurrency,
        exchangeRate: conversionDetails?.exchangeRate || 1,
        wasConverted: paymentCurrency !== referrerCurrency,
        newBalance: newAvailableBalance,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Referral commission processing failed:', error.message);
    return {
      success: false,
      error: error.message,
      referrerId,
      referredId
    };
  }
}

/**
 * Calculate referral commission amount based on payment
 * @param {number} paymentAmount - The payment amount
 * @param {number} commissionPercent - Commission percentage (default: 10%)
 * @returns {number} - Commission amount
 */
function calculateCommission(paymentAmount, commissionPercent = 10) {
  return Number((paymentAmount * (commissionPercent / 100)).toFixed(2));
}

/**
 * Get referral commission settings
 * You can modify this to fetch from database if needed
 */
function getCommissionSettings() {
  return {
    registrationBonus: 500, // Flat bonus for registration (in local currency)
    purchaseCommissionPercent: 10, // 10% of purchase amount
    minPayoutAmount: 1000, // Minimum balance for withdrawal
  };
}

export {
  processReferralCommission,
  calculateCommission,
  getCommissionSettings
};
