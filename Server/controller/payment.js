
import fetch from 'node-fetch';
import { supabase } from '../utils/supabaseClient.js';

export const verifyPaystack = async (req, res) => {
  const { reference } = req.params;

  console.log('Verifying Paystack reference:', reference);

  if (!reference || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing reference.',
    });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Paystack response:', result);

    if (!response.ok || !result.status || result.data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: result.data?.gateway_response || 'Payment failed',
      });
    }

    const { data } = result;
    const totalAmount = data.amount / 100; // Convert from kobo to naira

    // Get referrer ID and user ID from request body (POST) or metadata (GET)
    const referrerId = req.body?.referrer_id || data.metadata?.referrer_id || null;
    const newUserId = req.body?.user_id || data.metadata?.user_id || null;

    console.log('Payment Info:', { totalAmount, referrerId, newUserId });

    // SAVE TO SUPABASE with user_id and referral_code
    const { error: dbError } = await supabase
      .from('transactions')
      .upsert(
        {
          reference: data.reference,
          email: data.customer.email,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          gateway_response: data.gateway_response,
          paid_at: data.paid_at,
          metadata: data.metadata,
          customer_data: data.customer,
          authorization_data: data.authorization,
          user_id: newUserId,
          referral_code: referrerId,
        },
        { onConflict: 'reference' }
      );

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save transaction.',
      });
    }

    console.log('Transaction saved successfully');

    // HANDLE REFERRAL COMMISSION DISTRIBUTION
    if (referrerId && newUserId) {
      console.log('Processing referral commission for referrer:', referrerId);

      // Verify referrer exists
      const { data: referrerExists, error: referrerCheckError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', referrerId)
        .single();

      if (referrerCheckError || !referrerExists) {
        console.error('Referrer not found:', referrerId);
      } else {
        console.log('Referrer found:', referrerExists.full_name);

        // Split: 50% company, 50% referrer
        const companyShare = totalAmount * 0.5;
        const referrerTotal = totalAmount * 0.5;

        // From referrer's 50%: 10% commission + 40% balance
        const commissionAmount = totalAmount * 0.1;  // 10% of total
        const balanceAmount = totalAmount * 0.4;     // 40% of total

        console.log('Commission breakdown:', {
          total: totalAmount,
          companyShare,
          referrerTotal,
          commissionAmount,
          balanceAmount
        });

        // Update referrer's user_balances
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('available_balance, total_earned')
          .eq('user_id', referrerId)
          .single();

        if (!balanceError && balanceData) {
          const newAvailableBalance = (balanceData.available_balance || 0) + balanceAmount;
          const newTotalEarned = (balanceData.total_earned || 0) + referrerTotal;

          // Update with count
          const { error: updateError, count } = await supabase
            .from('user_balances')
            .update({
              available_balance: newAvailableBalance,
              total_earned: newTotalEarned,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', referrerId);

          if (updateError) {
            console.error('Error updating referrer balance:', updateError);
          } else if (count === 0) {
            // No row was updated → balance doesn't exist
            console.warn(`No balance found for referrer ${referrerId}. Creating default balance...`);

            // Create default balance
            const { error: insertError } = await supabase
              .from('user_balances')
              .insert({
                user_id: referrerId,
                available_balance: balanceAmount,
                pending_balance: 0,
                total_earned: referrerTotal,
                total_withdrawn: 0,
                currency: balanceData.currency || 'NGN (₦)', // fallback
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('Failed to create balance for referrer:', insertError);
            } else {
              console.log(`Default balance created for referrer ${referrerId}: +${balanceAmount} available`);
            }
          } else {
            // Success: row was updated
            console.log(`Referrer balance updated: +${balanceAmount} available, +${referrerTotal} total earned (count: ${count})`);
          }
        }

        // Record in referral_commissions table
        const { error: commissionError } = await supabase
          .from('referral_commissions')
          .insert({
            referrer_id: referrerId,
            referred_user_id: newUserId,
            course_id: 1, // Registration commission (use course_id 1 or create a dummy course)
            amount: referrerTotal,
            commission_rate: 50,
            status: 'paid',
            transaction_id: data.reference,
            earned_date: new Date().toISOString(),
            paid_date: new Date().toISOString(),
            company_share: companyShare,
            referrer_share: referrerTotal,
            commission_amount: commissionAmount,
            balance_amount: balanceAmount,
          });

        if (commissionError) {
          console.error('Error recording commission:', commissionError);
        } else {
          console.log('✅ Commission recorded in referral_commissions');
        }

        console.log(`Company receives: ${companyShare}`);
      }
    } else {
      console.log('No referrer - Company gets 100%:', totalAmount);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and commissions distributed.',
      data: {
        reference: data.reference,
        email: data.customer.email,
        amount: totalAmount,
        currency: data.currency,
        referrer_credited: !!referrerId,
      },
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};