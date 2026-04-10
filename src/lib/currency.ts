/**
 * Currency Utility for Sierra Leone Localization
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * Properties: 1, 2, 3, 4
 * 
 * This utility provides consistent currency formatting across the frontend application.
 * It matches the backend implementation to ensure consistency.
 */

export const CURRENCY = {
  code: 'SLE',
  symbol: 'Le',
  decimalPlaces: 2,

  /**
   * Format a monetary amount with SLE currency symbol and proper formatting
   * Property 1: Currency symbol prefix
   * Property 2: Two decimal places
   * Property 3: Thousand separators
   * Requirements: 1.1, 1.2, 1.3
   * 
   * @param amount - The numeric amount to format
   * @returns Formatted string with "Le" prefix, two decimal places, and comma separators
   * @example
   * CURRENCY.format(1234.56) // "Le 1,234.56"
   * CURRENCY.format(100) // "Le 100.00"
   */
  format(amount: number): string {
    // Handle invalid inputs
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${this.symbol} 0.00`;
    }

    // Format with two decimal places
    const fixedAmount = amount.toFixed(this.decimalPlaces);
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart] = fixedAmount.split('.');
    
    // Add thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${this.symbol} ${formattedInteger}.${decimalPart}`;
  },

  /**
   * Format a monetary amount without the currency symbol
   * Requirements: 1.2, 1.3
   * 
   * @param amount - The numeric amount to format
   * @returns Formatted string with two decimal places and comma separators (no symbol)
   * @example
   * CURRENCY.formatWithoutSymbol(1234.56) // "1,234.56"
   */
  formatWithoutSymbol(amount: number): string {
    // Handle invalid inputs
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }

    // Format with two decimal places
    const fixedAmount = amount.toFixed(this.decimalPlaces);
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart] = fixedAmount.split('.');
    
    // Add thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${formattedInteger}.${decimalPart}`;
  },

  /**
   * Format a monetary amount in compact form (for space-constrained displays)
   * Requirements: 1.1, 1.2, 1.3
   * 
   * @param amount - The numeric amount to format
   * @returns Formatted string with "Le" prefix and compact notation for large numbers
   * @example
   * CURRENCY.formatCompact(1234.56) // "Le 1,234.56"
   * CURRENCY.formatCompact(1234567.89) // "Le 1.23M"
   */
  formatCompact(amount: number): string {
    // Handle invalid inputs
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${this.symbol} 0.00`;
    }

    // For amounts less than 1 million, use regular formatting
    if (Math.abs(amount) < 1000000) {
      return this.format(amount);
    }

    // For larger amounts, use compact notation
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    if (absAmount >= 1000000000) {
      return `${sign}${this.symbol} ${(absAmount / 1000000000).toFixed(2)}B`;
    } else if (absAmount >= 1000000) {
      return `${sign}${this.symbol} ${(absAmount / 1000000).toFixed(2)}M`;
    }
    
    return this.format(amount);
  },

  /**
   * Parse a formatted currency string back to a number
   * 
   * @param formattedAmount - The formatted currency string
   * @returns The numeric value
   * @example
   * CURRENCY.parse("Le 1,234.56") // 1234.56
   * CURRENCY.parse("1,234.56") // 1234.56
   */
  parse(formattedAmount: string): number {
    if (!formattedAmount || typeof formattedAmount !== 'string') {
      return 0;
    }

    // Remove currency symbol, spaces, and commas
    const cleanedAmount = formattedAmount
      .replace(this.symbol, '')
      .replace(/\s/g, '')
      .replace(/,/g, '');
    
    const parsed = parseFloat(cleanedAmount);
    
    return isNaN(parsed) ? 0 : parsed;
  },
};
