// controllers/cryptoPaymentController.js
import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';
import crypto from 'crypto';

export const updateCryptoPaymentStatus = async (req, res) => {
  const { payment_id, status } = req.body;

  if (!payment_id || !['approved', 'rejected', 'pending'].includes(status)) {
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

    // If resetting to pending (silent, no emails)
    if (status === 'pending') {
      // Update crypto_payments back to pending
      const { error: updateError } = await supabase
        .from('crypto_payments')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment_id);

      if (updateError) throw updateError;

      // Deactivate user account (reset paid to false)
      const { error: userError } = await supabase
        .from('users')
        .update({
          paid: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userError) throw userError;

      return res.json({
        success: true,
        message: 'Payment reset to pending. User account deactivated.',
      });
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userError) throw userError;

      // 4. Fetch wallet_amount (USD) from system_settings and get user's currency
      const { data: systemSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('wallet_amount')
        .single();

      if (settingsError) {
        console.error('Error fetching system settings:', settingsError);
      }

      const walletAmountUSD = systemSettings?.wallet_amount || 50; // Default $50
      console.log('Crypto payment amount (USD):', walletAmountUSD);

      // 5. Fetch new user details, referrer_id, and currency
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .select('full_name, email, referrer_id, currency')
        .eq('id', payment.user_id)
        .single();

      if (newUserError) {
        console.error('Error fetching new user:', newUserError);
        // Don't return - continue with user activation even if profile fetch fails
      }

      const userCurrency = newUserData?.currency || 'NGN';
      const referrerId = newUserData?.referrer_id;
      console.log('User currency:', userCurrency);
      console.log('Processing crypto approval for user:', payment.user_id, 'Referrer:', referrerId);
      
      // Log if referrer exists
      if (!referrerId) {
        console.log('⚠️ No referrer_id found for user:', payment.user_id);
      }

      // 6. Send welcome email to new user
      try {
        if (newUserData?.email) {
          await sendEmailDirect({
            to: newUserData.email,
            subject: 'Payment Approved - Welcome to Affiliate Academy! 🎉',
            message: `Great news! Your crypto payment has been verified and approved by our admin team. Your account is now fully activated and you can login immediately. 
            
             Payment Status: APPROVED
             Account Status: ACTIVE
            Login Access: ENABLED
            
            You can now log in to your dashboard and start exploring our affiliate programs. We're excited to have you on board and look forward to helping you succeed in your affiliate marketing journey!
            
            If you have any questions, feel free to reach out to our support team.`,
            name: newUserData.full_name
          });
          console.log(' Approval email sent to user:', newUserData.email);
        }
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      // 7. HANDLE REFERRAL COMMISSION DISTRIBUTION
      if (referrerId) {
        console.log('✅ Processing referral commission for referrer:', referrerId);

        // Verify referrer exists and get email and currency
        const { data: referrerExists, error: referrerCheckError } = await supabase
          .from('users')
          .select('id, full_name, email, currency')
          .eq('id', referrerId)
          .single();

        if (referrerCheckError || !referrerExists) {
          console.error('❌ Referrer not found:', referrerId, referrerCheckError);
          // Continue with company getting 100%
        } else {
          console.log('✅ Referrer found:', referrerExists.full_name, referrerExists.email);

          // Get referrer's currency for conversion
          let referrerCurrency = referrerExists.currency || 'USD';
          
          // Split in USD: 50% company, 50% referrer
          const companyShareUSD = walletAmountUSD * 0.5;
          const referrerTotalUSD = walletAmountUSD * 0.5;

          console.log('USD Split:', {
            walletAmountUSD,
            companyShareUSD,
            referrerTotalUSD
          });

          // Convert to referrer's currency using live exchange rate
          let exchangeRate = 1;
          let companyShareConverted = companyShareUSD;
          let referrerTotalConverted = referrerTotalUSD;

          if (referrerCurrency !== 'USD') {
            try {
              const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
              const rateData = await response.json();
              
              if (rateData && rateData.rates && rateData.rates[referrerCurrency]) {
                exchangeRate = rateData.rates[referrerCurrency];
                companyShareConverted = companyShareUSD * exchangeRate;
                referrerTotalConverted = referrerTotalUSD * exchangeRate;
                console.log(` Exchange rate USD to ${referrerCurrency}: ${exchangeRate}`);
                console.log(` Converted company share: ${referrerCurrency} ${companyShareConverted.toFixed(2)}`);
                console.log(`Converted referrer share: ${referrerCurrency} ${referrerTotalConverted.toFixed(2)}`);
              } else {
                console.log(`  Currency ${referrerCurrency} not found, using USD value`);
                referrerCurrency = 'USD';
              }
            } catch (conversionError) {
              console.error('Currency conversion failed:', conversionError.message);
              console.log('  Using USD value without conversion');
              referrerCurrency = 'USD';
            }
          } else {
            console.log('Referrer currency is USD, no conversion needed');
          }

          // Get currency symbol for display
          const currencySymbols = {
            'USD': '$',
            'NGN': '₦',
            'EUR': '€',
            'GBP': '£',
            'GHS': '₵',
            'KES': 'KSh',
            'ZAR': 'R'
          };
          const currencySymbol = currencySymbols[referrerCurrency] || referrerCurrency;

          // Calculate commission breakdown (10% commission, 40% balance from referrer's 50%)
          const commissionAmount = referrerTotalConverted * 0.2;  // 10% of total = 20% of referrer's 50%
          const balanceAmount = referrerTotalConverted * 0.8;     // 40% of total = 80% of referrer's 50%

          console.log('Commission breakdown:', {
            currency: referrerCurrency,
            companyShare: companyShareConverted,
            referrerTotal: referrerTotalConverted,
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
              const newTotalEarnings = currentEarnings + companyShareConverted;
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
                console.log(`Company wallet updated: +${currencySymbol}${companyShareConverted.toFixed(2)} (Total: ${currencySymbol}${newTotalEarnings.toFixed(2)})`);
              }
            }
          } catch (companyWalletError) {
            console.error('Company wallet update failed:', companyWalletError);
          }

          // 9. UPDATE REFERRER'S USER_BALANCES (store in their currency)
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
            const newAvailableBalance = (balanceData.available_balance || 0) + referrerTotalConverted;
            const newTotalEarned = (balanceData.total_earned || 0) + referrerTotalConverted;

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
              console.log(`✅ Referrer balance updated: +${currencySymbol}${referrerTotalConverted.toFixed(2)} (Total: ${currencySymbol}${newAvailableBalance.toFixed(2)})`);
            }
          } else {
            // User balance doesn't exist - CREATE IT
            const { error: insertError } = await supabase
              .from('user_balances')
              .insert({
                id: crypto.randomUUID(),
                user_id: referrerId,
                available_balance: referrerTotalConverted,
                pending_balance: 0,
                total_earned: referrerTotalConverted,
                total_withdrawn: 0
              });

            if (insertError) {
              console.error('❌ Failed to create balance for referrer:', insertError);
            } else {
              console.log(`✅ Balance created for referrer: ${currencySymbol}${referrerTotalConverted.toFixed(2)}`);
            }
          }

          // 10. Record in referral_commissions table (store in referrer's currency)
          const { error: commissionError } = await supabase
            .from('referral_commissions')
            .insert({
              referrer_id: referrerId,
              referred_user_id: payment.user_id,
              course_id: 1, // Registration commission
              amount: referrerTotalConverted,
              commission_rate: 50,
              status: 'paid',
              transaction_id: `CRYPTO-${payment_id}`,
              earned_date: new Date().toISOString(),
              paid_date: new Date().toISOString(),
              company_share: companyShareConverted,
              referrer_share: referrerTotalConverted,
              commission_amount: commissionAmount,
              balance_amount: balanceAmount,
            });

          if (commissionError) {
            console.error('Error recording commission:', commissionError);
          } else {
            console.log('✅ Commission recorded in referral_commissions');
          }

          // 11. Send referral success email to referrer with their currency
          try {
            if (referrerExists.email) {
              await sendEmailDirect({
                to: referrerExists.email,
                subject: 'New Referral Commission Earned! 💰',
                message: `Great news! ${newUserData.full_name} just registered using your referral link via crypto payment. You've earned ${currencySymbol}${referrerTotalConverted.toLocaleString()} in commissions! Your commission breakdown: ${currencySymbol}${commissionAmount.toLocaleString()} commission + ${currencySymbol}${balanceAmount.toLocaleString()} balance. The amount has been added to your account (in ${referrerCurrency}) and is available for withdrawal. Keep sharing your referral link to earn more!`,
                name: referrerExists.full_name
              });
              console.log('✅ Referral notification email sent to:', referrerExists.email);
            }
          } catch (emailError) {
            console.error('❌ Failed to send referral email:', emailError.message);
          }

          console.log(`Company receives: ${referrerCurrency} ${companyShareConverted.toFixed(2)}`);
        }
      } else {
        console.log('No referrer - Company gets 100%');
        
        // Convert $50 USD to user currency for company wallet
        let companyAmountConverted = walletAmountUSD;
        let companyCurrency = userCurrency;
        
        if (userCurrency !== 'USD') {
          try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
            const rateData = await response.json();
            
            if (rateData && rateData.rates && rateData.rates[userCurrency]) {
              const exchangeRate = rateData.rates[userCurrency];
              companyAmountConverted = walletAmountUSD * exchangeRate;
              console.log(`✅ Exchange rate USD to ${userCurrency}: ${exchangeRate}`);
              console.log(`✅ Converted amount: ${userCurrency} ${companyAmountConverted.toFixed(2)}`);
            }
          } catch (conversionError) {
            console.error('Currency conversion failed:', conversionError.message);
            companyCurrency = 'USD';
          }
        }
        
        const currencySymbols = {
          'USD': '$',
          'NGN': '₦',
          'EUR': '€',
          'GBP': '£',
          'GHS': '₵',
          'KES': 'KSh',
          'ZAR': 'R'
        };
        const currencySymbol = currencySymbols[companyCurrency] || companyCurrency;
        
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
            const newTotalEarnings = currentEarnings + companyAmountConverted;
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
              console.log(`✅ Company wallet updated: +${currencySymbol}${companyAmountConverted.toFixed(2)} (Total: ${currencySymbol}${newTotalEarnings.toFixed(2)})`);
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