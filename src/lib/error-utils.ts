import axios from 'axios';

/**
 * Extracts error message from various error types
 * @param error - The error object (axios error, Error, or unknown)
 * @param defaultMessage - Fallback message if extraction fails
 * @returns Extracted or default error message
 */
export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
};
