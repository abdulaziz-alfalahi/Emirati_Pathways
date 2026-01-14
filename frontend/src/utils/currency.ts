
/**
 * Utility for formatting currency values.
 * Defaults to UAE Dirham (AED).
 */

export const UAE_CURRENCY_CODE = 'AED';
export const UAE_CURRENCY_LOCALE = 'en-AE';

/**
 * Formats a number as a currency string.
 * @param amount The numerical amount to format.
 * @param currency The currency code (default: AED).
 * @param locale The locale to use for formatting (default: en-AE).
 * @returns Formatted currency string (e.g., "AED 1,000.00").
 */
export const formatCurrency = (
    amount: number,
    currency: string = UAE_CURRENCY_CODE,
    locale: string = UAE_CURRENCY_LOCALE
): string => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (error) {
        console.warn(`Error formatting currency: ${error}`);
        return `${currency} ${amount.toFixed(2)}`;
    }
};

/**
 * Returns the symbol or abbreviation for the currency.
 * Useful when you want just the label (e.g. "AED") without the amount.
 */
export const getCurrencyLabel = (currency: string = UAE_CURRENCY_CODE): string => {
    return currency;
};
