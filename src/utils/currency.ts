/**
 * Hardcoded baseline exchange rates for the Southeast Asian region.
 * Using static realistic rates for the hackathon MVP to ensure reliability
 * and prevent external third-party API breakages.
 */
export const LOCAL_EXCHANGE_RATES = {
  PHP: 56.50,    // Philippine Peso (Paluwagan)
  VND: 24500.00, // Vietnamese Dong (Hụi)
  IDR: 15800.00, // Indonesian Rupiah (Arisan)
} as const;

export type LocalCurrencyCode = keyof typeof LOCAL_EXCHANGE_RATES;

/**
 * Localizes a USDC stablecoin amount to regional fiat values.
 * Uses native Intl.NumberFormat for correct currency symbols, spacing, and decimal precision.
 * 
 * @param usdcAmount - Amount in USDC (assumed 1 USDC = 1 USD)
 * @param targetCurrency - Local currency target ('PHP' | 'VND' | 'IDR')
 * @returns A formatted string e.g., "₱565.00", "₫245,000", or "Rp158,000"
 */
export function formatToLocalCurrency(
  usdcAmount: number,
  targetCurrency: LocalCurrencyCode
): string {
  const rate = LOCAL_EXCHANGE_RATES[targetCurrency];
  const convertedAmount = usdcAmount * rate;

  const configMap: Record<LocalCurrencyCode, { locale: string; options: Intl.NumberFormatOptions }> = {
    PHP: {
      locale: "en-PH",
      options: {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
    VND: {
      locale: "vi-VN",
      options: {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0, // Dong typically does not use decimals
      },
    },
    IDR: {
      locale: "id-ID",
      options: {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0, // Rupiah is often formatted without decimals in common usage
      },
    },
  };

  const { locale, options } = configMap[targetCurrency];

  return new Intl.NumberFormat(locale, options).format(convertedAmount);
}
