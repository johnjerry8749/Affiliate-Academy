// controllers/cryptoPaymentController.js
import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';
import crypto from 'crypto';

// Helper function to get exchange rate
async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    console.log(`Fetching exchange rate: ${fromCurrency} to ${toCurrency}`);
    
    // Use Frankfurter API (free, reliable, no auth)
    const url = `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`;
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, JSON.stringify(data));
    
    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`Rate for ${toCurrency} not found in response`);
    }
    
    const rate = data.rates[toCurrency];
    console.log(`Exchange rate ${fromCurrency} to ${toCurrency}: ${rate}`);
    return rate;
  } catch (error) {
    console.error(`Failed to get ${fromCurrency} to ${toCurrency} rate:`, error.message);
    
    // Fallback to hardcoded rates if API fails
    console.log('Using fallback exchange rates');
    const fallbackRates = {
      'USD-NGN': 1452.97,
      'USD-GHS': 11.2,
      'USD-EUR': 0.93,
      'USD-GBP': 0.79,
      'USD-KES': 129.5,
      'USD-ZAR': 18.5
    };
    
    const key = `${fromCurrency}-${toCurrency}`;
    if (fallbackRates[key]) {
      console.log(`Using fallback rate for ${key}: ${fallbackRates[key]}`);
      return fallbackRates[key];
    }
    
    throw error;
  }
}

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
        console.error('❌ Error fetching new user:', newUserError);
        console.error('❌ User ID:', payment.user_id);
        // Don't return - continue with user activation even if profile fetch fails
      }

      if (!newUserData) {
        console.error('❌ No user data found for user_id:', payment.user_id);
        return res.status(404).json({ error: 'User not found' });
      }

      const userCurrency = newUserData?.currency || 'NGN';
      const referrerId = newUserData?.referrer_id;
      console.log('User data fetched successfully');
      console.log('   User email:', newUserData.email);
      console.log('   User currency:', userCurrency);
      console.log('   Referrer ID:', referrerId || 'NONE');
      
      // Log if referrer exists
      if (!referrerId) {
        console.log('WARNING: No referrer_id found - Company will get 100%');
      } else {
        console.log('Referrer ID found - Will process 50/50 split');
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
      let shouldProcessReferral = false;
      let referrerExists = null;
      
      if (referrerId) {
        console.log('Processing referral commission for referrer:', referrerId);

        // Verify referrer exists and get email and currency
        const { data: referrerData, error: referrerCheckError } = await supabase
          .from('users')
          .select('id, full_name, email, currency')
          .eq('id', referrerId)
          .single();

        if (referrerCheckError || !referrerData) {
          console.error('ERROR: Referrer not found in database!');
          console.error('   Referrer ID:', referrerId);
          console.error('   Error:', referrerCheckError);
          console.log('WARNING: Company will get 100% instead');
          shouldProcessReferral = false;
        } else {
          console.log('Referrer verified:', referrerData.full_name, referrerData.email);
          referrerExists = referrerData;
          shouldProcessReferral = true;
        }
      }

      if (shouldProcessReferral && referrerExists) {

          // Get referrer's currency for conversion
          let referrerCurrency = referrerExists.currency || 'USD';
          
          // Split in USD: 50% company (converts to NGN), 50% referrer (converts to their currency)
          const companyShareUSD = walletAmountUSD * 0.5;
          const referrerTotalUSD = walletAmountUSD * 0.5;

          console.log('USD Split:', {
            walletAmountUSD,
            companyShareUSD: `$${companyShareUSD.toFixed(2)} (will convert to NGN)`,
            referrerTotalUSD: `$${referrerTotalUSD.toFixed(2)} (will convert to ${referrerCurrency})`
          });

          // Convert company share to NGN
          let companyShareNGN = companyShareUSD;
          let ngnExchangeRate = 1;
          
          try {
            ngnExchangeRate = await getExchangeRate('USD', 'NGN');
            companyShareNGN = companyShareUSD * ngnExchangeRate;
            console.log(`Company share converted: $${companyShareUSD.toFixed(2)} USD = NGN ${companyShareNGN.toFixed(2)} (rate: ${ngnExchangeRate})`);
          } catch (conversionError) {
            console.error('❌ Company NGN conversion failed:', conversionError.message);
            console.log('WARNING: Company share staying in USD:', companyShareUSD);
          }

          // Convert referrer's share to their currency
          let exchangeRate = 1;
          let referrerTotalConverted = referrerTotalUSD;

          if (referrerCurrency !== 'USD') {
            try {
              exchangeRate = await getExchangeRate('USD', referrerCurrency);
              referrerTotalConverted = referrerTotalUSD * exchangeRate;
              console.log(`Exchange rate USD to ${referrerCurrency}: ${exchangeRate}`);
              console.log(`Referrer share converted: $${referrerTotalUSD.toFixed(2)} USD = ${referrerTotalConverted.toFixed(2)} ${referrerCurrency}`);
            } catch (conversionError) {
              console.error('❌ Currency conversion failed:', conversionError.message);
              console.log('WARNING: Using USD value without conversion');
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
          const referrerCurrencySymbol = currencySymbols[referrerCurrency] || referrerCurrency;

          // Calculate commission breakdown for referrer (in their currency)
          const commissionAmount = referrerTotalConverted * 0.2;  // 20% of referrer's share
          const balanceAmount = referrerTotalConverted * 0.8;     // 80% of referrer's share

          console.log('Commission breakdown:', {
            companyShare: `₦${companyShareNGN.toFixed(2)} NGN`,
            referrerCurrency: referrerCurrency,
            referrerTotal: `${referrerCurrencySymbol}${referrerTotalConverted.toFixed(2)}`,
            commissionAmount: `${referrerCurrencySymbol}${commissionAmount.toFixed(2)}`,
            balanceAmount: `${referrerCurrencySymbol}${balanceAmount.toFixed(2)}`
          });

          // 8. UPDATE COMPANY WALLET - Store company's 50% share IN NGN
          try {
            const { data: companyWallet, error: walletFetchError } = await supabase
              .from('company_wallet')
              .select('total_earnings, id')
              .maybeSingle();

            if (walletFetchError) {
              console.error('Error fetching company wallet:', walletFetchError);
            } else {
              const currentEarnings = companyWallet?.total_earnings || 0;
              const newTotalEarnings = currentEarnings + companyShareNGN; // Store in NGN

              const { error: walletUpdateError } = await supabase
                .from('company_wallet')
                .upsert({
                  id: companyWallet?.id || '00000000-0000-0000-0000-000000000001',
                  total_earnings: newTotalEarnings
                });

              if (walletUpdateError) {
                console.error('❌ Error updating company wallet:', walletUpdateError);
              } else {
                console.log(`Company wallet updated: +NGN ${companyShareNGN.toFixed(2)} (Total: NGN ${newTotalEarnings.toFixed(2)})`);
              }
            }
          } catch (companyWalletError) {
            console.error('❌ Company wallet update failed:', companyWalletError);
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
              console.log(`Referrer balance updated: +${referrerCurrencySymbol}${referrerTotalConverted.toFixed(2)} (Total: ${referrerCurrencySymbol}${newAvailableBalance.toFixed(2)})`);
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
              console.log(`Balance created for referrer: ${referrerCurrencySymbol}${referrerTotalConverted.toFixed(2)}`);
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
              company_share: companyShareNGN, // Store company share in NGN
              referrer_share: referrerTotalConverted,
              commission_amount: commissionAmount,
              balance_amount: balanceAmount,
            });

          if (commissionError) {
            console.error('❌ Error recording commission:', commissionError);
          } else {
            console.log('Commission recorded in referral_commissions');
          }

          // 11. Send referral success email to referrer with their currency
          try {
            if (referrerExists.email) {
              await sendEmailDirect({
                to: referrerExists.email,
                subject: 'New Referral Commission Earned! 💰',
                message: `Great news! ${newUserData.full_name} just registered using your referral link via crypto payment. You've earned ${referrerCurrencySymbol}${referrerTotalConverted.toLocaleString()} in commissions! Your commission breakdown: ${referrerCurrencySymbol}${commissionAmount.toLocaleString()} commission + ${referrerCurrencySymbol}${balanceAmount.toLocaleString()} balance. The amount has been added to your account (in ${referrerCurrency}) and is available for withdrawal. Keep sharing your referral link to earn more!`,
                name: referrerExists.full_name
              });
              console.log('Referral notification email sent to:', referrerExists.email);
            }
          } catch (emailError) {
            console.error('❌ Failed to send referral email:', emailError.message);
          }

          console.log(`Distribution complete: Company $${companyShareUSD.toFixed(2)} USD | Referrer ${referrerCurrencySymbol}${referrerTotalConverted.toFixed(2)} ${referrerCurrency}`);
        } // End of shouldProcessReferral block
      } else if (!shouldProcessReferral) {
        // If no referrer or referrer not found - Company gets 100%
        console.log('No valid referrer - Company gets 100%');
        
        // Convert full amount to NGN for company wallet
        let companyAmountNGN = walletAmountUSD;
        
        try {
          const exchangeRate = await getExchangeRate('USD', 'NGN');
          companyAmountNGN = walletAmountUSD * exchangeRate;
          console.log(`Exchange rate USD to NGN: ${exchangeRate}`);
          console.log(`Company gets: $${walletAmountUSD.toFixed(2)} USD = NGN ${companyAmountNGN.toFixed(2)}`);
        } catch (conversionError) {
          console.error('❌ Currency conversion failed:', conversionError.message);
          console.log('WARNING: Company amount staying in USD:', walletAmountUSD);
        }
        
        // UPDATE COMPANY WALLET - Store 100% in NGN when no referral
        try {
          const { data: companyWallet, error: walletFetchError } = await supabase
            .from('company_wallet')
            .select('total_earnings, id')
            .maybeSingle();

          if (walletFetchError) {
            console.error('Error fetching company wallet:', walletFetchError);
          } else {
            const currentEarnings = companyWallet?.total_earnings || 0;
            const newTotalEarnings = currentEarnings + companyAmountNGN;
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
              console.log(`Company wallet updated: +NGN ${companyAmountNGN.toFixed(2)} (Total: NGN ${newTotalEarnings.toFixed(2)})`);
            }
          }
        } catch (companyWalletError) {
          console.error('Company wallet update failed (100%):', companyWalletError);
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