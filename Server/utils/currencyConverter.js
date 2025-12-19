import fetch from 'node-fetch';

// Exchange rate cache to avoid excessive API calls
let exchangeRateCache = {
  rates: {},
  lastUpdated: null,
  baseCurrency: 'USD'
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates from a free API
 * Using exchangerate-api.com (free tier available)
 * You can replace this with your preferred exchange rate API
 */
async function fetchExchangeRates() {
  try {
    // Check if cache is still valid
    if (
      exchangeRateCache.lastUpdated &&
      Date.now() - exchangeRateCache.lastUpdated < CACHE_DURATION &&
      Object.keys(exchangeRateCache.rates).length > 0
    ) {
      console.log('Using cached exchange rates');
      return exchangeRateCache.rates;
    }

    // Free API - no key required for basic usage
    // Alternative: use process.env.EXCHANGE_RATE_API_KEY if you have a paid plan
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
    let apiUrl;

    if (apiKey === 'free') {
      // Using free exchangerate.host API
      apiUrl = 'https://api.exchangerate.host/latest?base=USD';
    } else {
      // Using exchangerate-api.com with API key
      apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Failed to fetch rates'}`);
    }

    // Handle different API response formats
    const rates = data.rates || data.conversion_rates;

    if (!rates) {
      throw new Error('No rates found in API response');
    }

    // Update cache
    exchangeRateCache = {
      rates,
      lastUpdated: Date.now(),
      baseCurrency: 'USD'
    };

    console.log('Exchange rates updated successfully');
    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error.message);
    
    // Return fallback rates if API fails (approximate rates as of 2024)
    // These should be updated periodically as backup
    return {
      USD: 1,
      NGN: 1550,      // Nigerian Naira
      GHS: 15.5,      // Ghanaian Cedi
      KES: 153,       // Kenyan Shilling
      ZAR: 18.5,      // South African Rand
      GBP: 0.79,      // British Pound
      EUR: 0.92,      // Euro
      CAD: 1.36,      // Canadian Dollar
      AUD: 1.53,      // Australian Dollar
      INR: 83.5,      // Indian Rupee
      XOF: 605,       // West African CFA Franc
      XAF: 605,       // Central African CFA Franc
      EGP: 50.5,      // Egyptian Pound
      MAD: 10.0,      // Moroccan Dirham
      TZS: 2500,      // Tanzanian Shilling
      UGX: 3700,      // Ugandan Shilling
      RWF: 1300,      // Rwandan Franc
      ZMW: 27,        // Zambian Kwacha
      BWP: 13.5,      // Botswanan Pula
    };
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'NGN')
 * @param {string} toCurrency - Target currency code (e.g., 'USD')
 * @returns {Promise<{convertedAmount: number, exchangeRate: number, success: boolean}>}
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    // If same currency, no conversion needed
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return {
        success: true,
        convertedAmount: amount,
        exchangeRate: 1,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase()
      };
    }

    const rates = await fetchExchangeRates();

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Get rates (rates are based on USD)
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    // Convert: first to USD, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    // Calculate the direct exchange rate from source to target
    const exchangeRate = toRate / fromRate;

    console.log(`Currency conversion: ${amount} ${from} = ${convertedAmount.toFixed(2)} ${to} (Rate: ${exchangeRate.toFixed(6)})`);

    return {
      success: true,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      exchangeRate: parseFloat(exchangeRate.toFixed(6)),
      fromCurrency: from,
      toCurrency: to,
      originalAmount: amount
    };
  } catch (error) {
    console.error('Currency conversion failed:', error.message);
    return {
      success: false,
      convertedAmount: amount,
      exchangeRate: 1,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      error: error.message
    };
  }
}

/**
 * Get the exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} The exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  const result = await convertCurrency(1, fromCurrency, toCurrency);
  return result.exchangeRate;
}

/**
 * Force refresh the exchange rate cache
 */
export async function refreshExchangeRates() {
  exchangeRateCache.lastUpdated = null;
  return await fetchExchangeRates();
}

export default {
  convertCurrency,
  getExchangeRate,
  refreshExchangeRates
};
