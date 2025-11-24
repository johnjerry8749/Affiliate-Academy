import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';
import crypto from 'crypto';

export const updateCryptoPaymentStatus = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    console.log('Updating crypto payment status:', { paymentId, status });

    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and status are required'
      });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    // Fetch the crypto payment details with user info
    const { data: payment, error: fetchError } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        users (
          id,
          full_name,
          email,
          referred_by,
          currency
        )
      `)
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      console.error('Crypto payment not found:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Crypto payment not found'
      });
    }

    console.log('Crypto payment found:', payment.id);

    // Update the payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('crypto_payments')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating crypto payment:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment status',
        error: updateError.message
      });
    }

    console.log('Crypto payment status updated to:', status);

    // If status is APPROVED, process referral commission
    if (status === 'approved') {
      console.log('Processing crypto payment commission distribution...');
      
      // Fetch registration fee from system_settings
      const { data: systemSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('wallet_amount')
        .single();

      if (settingsError) {
        console.error('Error fetching system settings:', settingsError);
      }

      const totalAmount = systemSettings?.wallet_amount || 5000;
      console.log('Registration fee from settings:', totalAmount);

      const newUserId = payment.user_id;
      const referrerId = payment.users?.referred_by;

      console.log('Payment Info:', { totalAmount, referrerId, newUserId });

      // Send welcome email to new user
      try {
        if (payment.users?.email) {
          await sendEmailDirect({
            to: payment.users.email,
            subject: 'Payment Approved - Welcome to Affiliate Academy! 🎉',
            message: `Your crypto payment has been verified and approved! Thank you for joining Affiliate Academy. Your registration is now complete and you can access your dashboard. We're excited to have you on board!`,
            name: payment.users.full_name
          });
          console.log('Welcome email sent to:', payment.users.email);
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      // HANDLE REFERRAL COMMISSION DISTRIBUTION (if user was referred)
      if (referrerId && newUserId) {
        console.log(' Processing referral commission for referrer:', referrerId);

        // Verify referrer exists and get email
        const { data: referrerExists, error: referrerCheckError } = await supabase
          .from('users')
          .select('id, full_name, email, currency')
          .eq('id', referrerId)
          .single();

        if (referrerCheckError || !referrerExists) {
          console.error(' Referrer not found:', referrerId, referrerCheckError);
        } else {
          console.log(' Referrer found:', referrerExists.full_name, referrerExists.email);

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

          // 1. UPDATE COMPANY WALLET - Store company's 50% share
          try {
            const { data: companyWallet, error: walletFetchError } = await supabase
              .from('company_wallet')
              .select('total_earnings, id')
              .maybeSingle();

            if (walletFetchError) {
              console.error(' Error fetching company wallet:', walletFetchError);
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
                console.error(' Error updating company wallet:', walletUpdateError);
              } else {
                console.log(`Company wallet updated: +₦${companyShare} (Total: ₦${newTotalEarnings})`);
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
              console.error(' Error updating referrer balance:', updateError);
            } else {
              console.log(`Referrer balance updated: +₦${referrerTotal} (Total: ₦${newAvailableBalance})`);
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
              console.error('Failed to create balance for referrer:', insertError);
            } else {
              console.log(`Balance created for referrer: ₦${referrerTotal}`);
            }
          }

          // 3. Record in referral_commissions table
          const { error: commissionError } = await supabase
            .from('referral_commissions')
            .insert({
              referrer_id: referrerId,
              referred_user_id: newUserId,
              course_id: 1,
              amount: referrerTotal,
              commission_rate: 50,
              status: 'paid',
              transaction_id: `crypto_${payment.id}`,
              earned_date: new Date().toISOString(),
              paid_date: new Date().toISOString(),
              company_share: companyShare,
              referrer_share: referrerTotal,
              commission_amount: commissionAmount,
              balance_amount: balanceAmount,
            });

          if (commissionError) {
            console.error(' Error recording commission:', commissionError);
          } else {
            console.log('Commission recorded in referral_commissions');
          }

          // 4. Send referral success email to referrer with their currency
          try {
            if (!referrerExists.email) {
              console.error(' Referrer email not found in database');
              throw new Error('Referrer email missing');
            }

            const { data: newUserData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', newUserId)
              .single();

            const referredUserName = newUserData?.full_name || 'A new user';

            // Get referrer's currency
            const referrerCurrency = referrerExists.currency || 'NGN';
            const currencySymbols = {
              'USD': '$',
              'EUR': '€',
              'GBP': '£',
              'NGN': '₦',
              'GHS': '₵',
              'KES': 'KSh',
              'ZAR': 'R'
            };
            const currencySymbol = currencySymbols[referrerCurrency] || '₦';

            console.log(`Sending referral email to: ${referrerExists.email}`);
            
            await sendEmailDirect({
              to: referrerExists.email,
              subject: 'New Referral Commission Earned! 💰',
              message: `Great news! ${referredUserName} just registered using your referral link and their crypto payment has been approved. You've earned ${currencySymbol}${referrerTotal.toLocaleString()} in commissions! Your commission breakdown: ${currencySymbol}${commissionAmount.toLocaleString()} commission + ${currencySymbol}${balanceAmount.toLocaleString()} balance. The amount has been added to your account and is available for withdrawal. Keep sharing your referral link to earn more!`,
              name: referrerExists.full_name
            });
            console.log(' Referral notification email sent to:', referrerExists.email);
          } catch (emailError) {
            console.error(' Failed to send referral email:', emailError.message);
          }

          console.log(`Company receives: ₦${companyShare}`);
        }
      } else {
        console.log('ℹ No referrer - Company gets 100%:', totalAmount);
        
        // UPDATE COMPANY WALLET - Store 100% when no referral
        try {
          const { data: companyWallet, error: walletFetchError } = await supabase
            .from('company_wallet')
            .select('total_earnings, id')
            .maybeSingle();

          if (walletFetchError) {
            console.error(' Error fetching company wallet:', walletFetchError);
          } else {
            const currentEarnings = companyWallet?.total_earnings || 0;
            const newTotalEarnings = currentEarnings + totalAmount;
            const walletId = companyWallet?.id || '00000000-0000-0000-0000-000000000001';

            const { error: walletUpdateError } = await supabase
              .from('company_wallet')
              .upsert({
                id: walletId,
                total_earnings: newTotalEarnings
              });

            if (walletUpdateError) {
              console.error('Error updating company wallet (100%):', walletUpdateError);
            } else {
              console.log(`Company wallet updated: +₦${totalAmount} (Total: ₦${newTotalEarnings})`);
            }
          }
        } catch (companyWalletError) {
          console.error('Company wallet update failed (100%):', companyWalletError);
        }
      }
    } else if (status === 'rejected') {
      // Send rejection email
      try {
        if (payment.users?.email) {
          await sendEmailDirect({
            to: payment.users.email,
            subject: 'Crypto Payment Declined',
            message: `We're sorry, but your crypto payment could not be verified. Please ensure you sent the correct amount to the correct wallet address and upload a clear payment receipt. If you need assistance, please contact our support team.`,
            name: payment.users.full_name
          });
          console.log('Rejection email sent to:', payment.users.email);
        }
      } catch (emailError) {
        console.error(' Failed to send rejection email:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Crypto payment ${status} successfully`,
      payment: updatedPayment
    });

  } catch (error) {
    console.error(' Error in updateCryptoPaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status',
      error: error.message
    });
  }
};
