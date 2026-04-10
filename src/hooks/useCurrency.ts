/**
 * Currency Hook for Sierra Leone Localization
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * Property 4: Formatting consistency across contexts
 * 
 * This hook provides consistent currency formatting across all React components.
 * It wraps the currency utility to provide a React-friendly interface.
 */

import { useMemo } from 'react';
import { CURRENCY } from '../lib/currency';

/**
 * Hook for consistent currency formatting throughout the application
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * @returns Object containing currency formatting functions and constants
 * @example
 * const { format, symbol, code } = useCurrency();
 * const displayPrice = format(1234.56); // "Le 1,234.56"
 */
export const useCurrency = () => {
  // Memoize the currency object to prevent unnecessary re-renders
  const currency = useMemo(() => ({
    /**
     * Format a monetary amount with SLE currency symbol
     * Property 1: Currency symbol prefix
     * Property 2: Two decimal places
     * Property 3: Thousand separators
     */
    format: (amount: number): string => CURRENCY.format(amount),
    
    /**
     * Format a monetary amount without the currency symbol
     */
    formatWithoutSymbol: (amount: number): string => CURRENCY.formatWithoutSymbol(amount),
    
    /**
     * Format a monetary amount in compact form
     */
    formatCompact: (amount: number): string => CURRENCY.formatCompact(amount),
    
    /**
     * Parse a formatted currency string back to a number
     */
    parse: (formattedAmount: string): number => CURRENCY.parse(formattedAmount),
    
    /**
     * Currency symbol (Le)
     */
    symbol: CURRENCY.symbol,
    
    /**
     * Currency code (SLE)
     */
    code: CURRENCY.code,
    
    /**
     * Number of decimal places (2)
     */
    decimalPlaces: CURRENCY.decimalPlaces,
  }), []);

  return currency;
};
