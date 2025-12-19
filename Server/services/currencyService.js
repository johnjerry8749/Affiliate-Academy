/**
 * Currency Conversion Service
 * Handles exchange rate fetching and currency conversion for referral commissions
 */

// Exchange rate cache to avoid excessive API calls
let rateCache = {
  rates: {},
  lastUpdated: null,
  cacheDuration: 60 * 60 * 1000 // 1 hour cache
};

// Supported currencies and their symbols
const SUPPORTED_CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc' },
};

// Fallback exchange rates (updated manually as backup)
// These are approximate rates - update periodically
const FALLBACK_RATES = {
  USD: 1,
  NGN: 1550,      // 1 USD = ~1550 NGN
  EUR: 0.92,      // 1 USD = ~0.92 EUR
  GBP: 0.79,      // 1 USD = ~0.79 GBP
  KES: 153,       // 1 USD = ~153 KES
  GHS: 15.5,      // 1 USD = ~15.5 GHS
  ZAR: 18.5,      // 1 USD = ~18.5 ZAR
  XOF: 605,       // 1 USD = ~605 XOF
  XAF: 605,       // 1 USD = ~605 XAF
};

/**
 * Fetch current exchange rates from API
 * Using exchangerate-api.com (free tier available)
 */
async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    // Check if cache is still valid
    if (rateCache.lastUpdated && (Date.now() - rateCache.lastUpdated < rateCache.cacheDuration)) {
      console.log('Using cached exchange rates');
      return rateCache.rates;
    }

    // Free API - no key required for basic usage
    // You can also use: https://api.exchangerate-api.com/v4/latest/USD
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Update cache
    rateCache.rates = data.rates;
    rateCache.lastUpdated = Date.now();
    
    console.log('Exchange rates fetched successfully');
    return data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error.message);
    console.log('Using fallback exchange rates');
    return FALLBACK_RATES;
  }
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code (e.g., 'NGN')
 * @param {string} toCurrency - Target currency code (e.g., 'USD')
 * @returns {Promise<number>} - Exchange rate
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    const rates = await fetchExchangeRates('USD');
    
    // Convert: fromCurrency -> USD -> toCurrency
    const fromToUSD = 1 / (rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1);
    const usdToTarget = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
    
    return fromToUSD * usdToTarget;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    // Use fallback calculation
    const fromToUSD = 1 / (FALLBACK_RATES[fromCurrency] || 1);
    const usdToTarget = FALLBACK_RATES[toCurrency] || 1;
    return fromToUSD * usdToTarget;
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<Object>} - Conversion result with details
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;
    
    return {
      success: true,
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Number(convertedAmount.toFixed(2)),
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    return {
      success: false,
      error: error.message,
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedCurrency: toCurrency
    };
  }
}

/**
 * Convert referral commission to referrer's currency
 * @param {number} commissionAmount - Commission amount in payment currency
 * @param {string} paymentCurrency - Currency of the payment (e.g., 'NGN' for Paystack)
 * @param {string} referrerCurrency - Referrer's preferred currency (e.g., 'USD')
 * @returns {Promise<Object>} - Conversion result for storing
 */
async function convertReferralCommission(commissionAmount, paymentCurrency, referrerCurrency) {
  console.log(`Converting referral commission: ${commissionAmount} ${paymentCurrency} → ${referrerCurrency}`);
  
  const result = await convertCurrency(commissionAmount, paymentCurrency, referrerCurrency);
  
  if (result.success) {
    console.log(`Conversion successful: ${result.originalAmount} ${result.originalCurrency} = ${result.convertedAmount} ${result.convertedCurrency}`);
  } else {
    console.error('Conversion failed:', result.error);
  }
  
  return result;
}

/**
 * Get currency info
 * @param {string} currencyCode - Currency code
 * @returns {Object} - Currency info (symbol, name)
 */
function getCurrencyInfo(currencyCode) {
  return SUPPORTED_CURRENCIES[currencyCode] || { symbol: currencyCode, name: currencyCode };
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} - Formatted amount with symbol
 */
function formatCurrency(amount, currencyCode) {
  const info = getCurrencyInfo(currencyCode);
  return `${info.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Clear the exchange rate cache (useful for testing or forced refresh)
 */
function clearRateCache() {
  rateCache = {
    rates: {},
    lastUpdated: null,
    cacheDuration: 60 * 60 * 1000
  };
  console.log('Exchange rate cache cleared');
}

export {
  convertCurrency,
  convertReferralCommission,
  getExchangeRate,
  fetchExchangeRates,
  getCurrencyInfo,
  formatCurrency,
  clearRateCache,
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES
};
