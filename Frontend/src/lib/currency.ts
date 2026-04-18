/**
 * Highly dynamic currency formatter utility for international finance support.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

export const COUNTRIES: Record<string, { name: string; flag: string; currency: CurrencyConfig }> = {
  IN: {
    name: "India",
    flag: "🇮🇳",
    currency: { code: "INR", symbol: "₹", locale: "en-IN" },
  },
  US: {
    name: "United States",
    flag: "🇺🇸",
    currency: { code: "USD", symbol: "$", locale: "en-US" },
  },
  UK: {
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: { code: "GBP", symbol: "£", locale: "en-GB" },
  },
  LK: {
    name: "Sri Lanka",
    flag: "🇱🇰",
    currency: { code: "LKR", symbol: "LKR", locale: "en-LK" },
  },
  UAE: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: { code: "AED", symbol: "د.إ", locale: "ar-AE" },
  },
  DE: {
    name: "Germany",
    flag: "🇩🇪",
    currency: { code: "EUR", symbol: "€", locale: "de-DE" },
  },
};

export const BASE_PREMIUM_PRICE_LKR = 299;

export const CONVERSION_RATES: Record<string, number> = {
  USD: 0.0034,
  INR: 0.28,
  GBP: 0.0027,
  EUR: 0.0031,
  AED: 0.012,
  LKR: 1,
};

/**
 * Calculates the premium price in the target currency based on LKR base price.
 */
export function getConvertedPremiumPrice(targetCurrencyCode: string): number {
  const rate = CONVERSION_RATES[targetCurrencyCode] || 1;
  return BASE_PREMIUM_PRICE_LKR * rate;
}

/**
 * Formats a numeric amount based on user localization settings.
 */
export function formatCurrency(
  amount: number,
  config: CurrencyConfig = COUNTRIES.LK.currency
): string {
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if formatting fails
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Formats large numbers into compact strings (e.g., 1.2M, 50k)
 */
export function formatCompact(amount: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);
}
