
import fetch from 'node-fetch';
import crypto from 'crypto';
import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';

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
  console.log('Response status:', response.status);
  console.log('Result.status:', result.status);
  console.log('Result.data?.status:', result.data?.status);

  if (!response.ok || !result.status || result.data?.status !== 'success') {
    console.error(' Payment verification failed:', {
      responseOk: response.ok,
      resultStatus: result.status,
      dataStatus: result.data?.status,
      gatewayResponse: result.data?.gateway_response,
      message: result.message
    });
    return res.status(400).json({
      success: false,
      message: result.data?.gateway_response || result.message || 'Payment failed',
    });
  }    const { data } = result;
    const totalAmount = data.amount / 100; // Convert from kobo to naira

    // Fetch registration fee from system_settings for commission calculation
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('registration_fee_amount')
      .single();

    if (settingsError) {
      console.error('Error fetching system settings:', settingsError);
    }

    const registrationFee = systemSettings?.registration_fee_amount || totalAmount;
    console.log('Registration fee from settings:', registrationFee);

    // Get referrer ID and user ID from request body (POST) or metadata (GET)
    const referrerId = req.body?.referrer_id || data.metadata?.referrer_id || null;
    const newUserId = req.body?.user_id || data.metadata?.user_id || null;

    console.log('Payment Info:', { totalAmount, registrationFee, referrerId, newUserId });

    // SAVE TO SUPABASE with user_id and referral_code
    const { error: dbError } = await supabase
      .from('transactions')
      .upsert(
        {
          reference: data.reference,
          email: data.customer.email,
          amount: data.amount / 100, // Store in Naira, not kobo
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

    // Send welcome email to new user
    try {
      const { data: newUserData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', newUserId)
        .single();

      if (newUserData) {
        await sendEmailDirect({
          to: newUserData.email,
          subject: 'Welcome to Affiliate Academy! 🎉',
          message: `Thank you for joining Affiliate Academy! Your registration has been successfully completed. 
          We're excited to have you on board and look forward to helping you succeed in your affiliate marketing journey. You can now log in to your dashboard and start exploring our programs.`,
          name: newUserData.full_name
        });
        console.log(' Welcome email sent to:', newUserData.email);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the transaction if email fails
    }

    // HANDLE REFERRAL COMMISSION DISTRIBUTION
    if (referrerId && newUserId) {
      console.log('Processing referral commission for referrer:', referrerId);

      // Verify referrer exists and get email
      const { data: referrerExists, error: referrerCheckError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', referrerId)
        .single();

      if (referrerCheckError || !referrerExists) {
        console.error('Referrer not found:', referrerId, referrerCheckError);
      } else {
        console.log('Referrer found:', referrerExists.full_name, referrerExists.email);

        // Split: 50% company, 50% referrer (using registration fee from settings)
        const companyShare = registrationFee * 0.5;
        const referrerTotal = registrationFee * 0.5;

        // From referrer's 50%: 10% commission + 40% balance
        const commissionAmount = registrationFee * 0.1;  // 10% of total
        const balanceAmount = registrationFee * 0.4;     // 40% of total

        console.log('Commission breakdown:', {
          total: registrationFee,
          companyShare,
          referrerTotal,
          commissionAmount,
          balanceAmount
        });

        // 1. UPDATE COMPANY WALLET - Store company's 50% share
        try {
          const { data: companyWallet, error: walletFetchError } = await supabase
            .from('company_wallet')
            .select('total_earnings, id')
            .maybeSingle();

          if (walletFetchError) {
            console.error('Error fetching company wallet:', walletFetchError);
          } else {
            const currentEarnings = companyWallet?.total_earnings || 0;
            const newTotalEarnings = currentEarnings + companyShare;
            const walletId = companyWallet?.id || '00000000-0000-0000-0000-000000000001';

            const { error: walletUpdateError } = await supabase
              .from('company_wallet')
              .upsert({
                id: walletId,
                total_earnings: newTotalEarnings
              });

            if (walletUpdateError) {
              console.error('Error updating company wallet:', walletUpdateError);
            } else {
              console.log(` Company wallet updated: +₦${companyShare} (Total: ₦${newTotalEarnings})`);
            }
          }
        } catch (companyWalletError) {
          console.error('Company wallet update failed:', companyWalletError);
        }

        // 2. UPDATE REFERRER'S USER_BALANCES
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('available_balance, total_earned')
          .eq('user_id', referrerId)
          .single();

        if (balanceError && balanceError.code !== 'PGRST116') {
          console.error('Error fetching referrer balance:', balanceError);
        }

        if (balanceData) {
          // User balance exists - UPDATE IT
          const newAvailableBalance = (balanceData.available_balance || 0) + referrerTotal;
          const newTotalEarned = (balanceData.total_earned || 0) + referrerTotal;

          const { error: updateError } = await supabase
            .from('user_balances')
            .update({
              available_balance: newAvailableBalance,
              total_earned: newTotalEarned
            })
            .eq('user_id', referrerId);

          if (updateError) {
            console.error('❌ Error updating referrer balance:', updateError);
          } else {
            console.log(`✅ Referrer balance updated: +₦${referrerTotal} (Total: ₦${newAvailableBalance})`);
          }
        } else {
          // User balance doesn't exist - CREATE IT
          const { error: insertError } = await supabase
            .from('user_balances')
            .insert({
              id: crypto.randomUUID(),
              user_id: referrerId,
              available_balance: referrerTotal,
              pending_balance: 0,
              total_earned: referrerTotal,
              total_withdrawn: 0
            });

          if (insertError) {
            console.error('❌ Failed to create balance for referrer:', insertError);
          } else {
            console.log(`✅ Balance created for referrer: ₦${referrerTotal}`);
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

        // Send referral success email to referrer
        try {
          if (!referrerExists.email) {
            console.error('❌ Referrer email not found in database');
            throw new Error('Referrer email missing');
          }

          const { data: newUserData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', newUserId)
            .single();

          const referredUserName = newUserData?.full_name || 'A new user';

          console.log(`📧 Sending referral email to: ${referrerExists.email}`);
          
          await sendEmailDirect({
            to: referrerExists.email,
            subject: 'New Referral Commission Earned! 💰',
            message: `Great news! ${referredUserName} just registered using your referral link. You've earned ₦${referrerTotal.toLocaleString()} in commissions! Your commission breakdown: ₦${commissionAmount.toLocaleString()} commission + ₦${balanceAmount.toLocaleString()} balance. The amount has been added to your account and is available for withdrawal. Keep sharing your referral link to earn more!`,
            name: referrerExists.full_name
          });
          console.log('✅ Referral notification email sent to:', referrerExists.email);
        } catch (emailError) {
          console.error('❌ Failed to send referral email:', emailError.message);
          console.error('Email error details:', emailError);
        }

        console.log(`Company receives: ${companyShare}`);
      }
    } else {
      console.log('No referrer - Company gets 100%:', registrationFee);
      
      // UPDATE COMPANY WALLET - Store 100% when no referral (using registration fee from settings)
      try {
        const { data: companyWallet, error: walletFetchError } = await supabase
          .from('company_wallet')
          .select('total_earnings, id')
          .maybeSingle();

        if (walletFetchError) {
          console.error('Error fetching company wallet:', walletFetchError);
        } else {
          const currentEarnings = companyWallet?.total_earnings || 0;
          const newTotalEarnings = currentEarnings + registrationFee;
          const walletId = companyWallet?.id || '00000000-0000-0000-0000-000000000001';

          const { error: walletUpdateError } = await supabase
            .from('company_wallet')
            .upsert({
              id: walletId,
              total_earnings: newTotalEarnings
            });

          if (walletUpdateError) {
            console.error('❌ Error updating company wallet (100%):', walletUpdateError);
          } else {
            console.log(`✅ Company wallet updated: +$${registrationFee} USD (Total: $${newTotalEarnings} USD)`);
          }
        }
      } catch (companyWalletError) {
        console.error('Company wallet update failed (100%):', companyWalletError);
      }
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