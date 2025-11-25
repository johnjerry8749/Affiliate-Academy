// controllers/cryptoPaymentController.js
import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';
import crypto from 'crypto';

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

    // 3. If APPROVED → Activate user and process referral commissions
    if (status === 'approved') {
      const { error: userError } = await supabase
        .from('users')
        .update({
          paid: true,
          is_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userError) throw userError;

      // 4. Fetch registration fee from system_settings
      const { data: systemSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('registration_fee_amount')
        .single();

      if (settingsError) {
        console.error('Error fetching system settings:', settingsError);
      }

      const registrationFee = systemSettings?.registration_fee_amount || 5000;
      console.log('Registration fee from settings:', registrationFee);

      // 5. Fetch new user details and referrer_id
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .select('full_name, email, referrer_id')
        .eq('id', payment.user_id)
        .single();

      if (newUserError) {
        console.error('Error fetching new user:', newUserError);
      }

      const referrerId = newUserData?.referrer_id;
      console.log('Processing crypto approval for user:', payment.user_id, 'Referrer:', referrerId);

      // 6. Send welcome email to new user
      try {
        if (newUserData?.email) {
          await sendEmailDirect({
            to: newUserData.email,
            subject: 'Payment Approved - Welcome to Affiliate Academy! 🎉',
            message: `Great news! Your crypto payment has been verified and approved by our admin team. Your account is now fully activated and you can login immediately. 
            
            ✅ Account Status: APPROVED & ACTIVE
            ✅ Login Access: ENABLED
            
            You can now log in to your dashboard at https://your-site.com/login and start exploring our affiliate programs. We're excited to have you on board and look forward to helping you succeed in your affiliate marketing journey!
            
            If you have any questions, feel free to reach out to our support team.`,
            name: newUserData.full_name
          });
          console.log('✅ Approval email sent to user:', newUserData.email);
        }
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      // 7. HANDLE REFERRAL COMMISSION DISTRIBUTION
      if (referrerId) {
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

          // Split: 50% company, 50% referrer
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

          // 8. UPDATE COMPANY WALLET - Store company's 50% share
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
                console.log(`✅ Company wallet updated: +₦${companyShare} (Total: ₦${newTotalEarnings})`);
              }
            }
          } catch (companyWalletError) {
            console.error('Company wallet update failed:', companyWalletError);
          }

          // 9. UPDATE REFERRER'S USER_BALANCES
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

          // 10. Record in referral_commissions table
          const { error: commissionError } = await supabase
            .from('referral_commissions')
            .insert({
              referrer_id: referrerId,
              referred_user_id: payment.user_id,
              course_id: 1, // Registration commission
              amount: referrerTotal,
              commission_rate: 50,
              status: 'paid',
              transaction_id: `CRYPTO-${payment_id}`,
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

          // 11. Send referral success email to referrer
          try {
            if (referrerExists.email) {
              await sendEmailDirect({
                to: referrerExists.email,
                subject: 'New Referral Commission Earned! 💰',
                message: `Great news! ${newUserData.full_name} just registered using your referral link via crypto payment. You've earned ₦${referrerTotal.toLocaleString()} in commissions! Your commission breakdown: ₦${commissionAmount.toLocaleString()} commission + ₦${balanceAmount.toLocaleString()} balance. The amount has been added to your account and is available for withdrawal. Keep sharing your referral link to earn more!`,
                name: referrerExists.full_name
              });
              console.log('✅ Referral notification email sent to:', referrerExists.email);
            }
          } catch (emailError) {
            console.error('❌ Failed to send referral email:', emailError.message);
          }

          console.log(`Company receives: ₦${companyShare}`);
        }
      } else {
        console.log('No referrer - Company gets 100%:', registrationFee);
        
        // UPDATE COMPANY WALLET - Store 100% when no referral
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
              console.log(`✅ Company wallet updated: +₦${registrationFee} (Total: ₦${newTotalEarnings})`);
            }
          }
        } catch (companyWalletError) {
          console.error('Company wallet update failed (100%):', companyWalletError);
        }
      }
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