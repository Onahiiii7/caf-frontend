/**
 * API utility functions for consistent data fetching
 */

/**
 * Builds query parameters from an object, filtering out undefined/null/empty values
 * 
 * @param params - Object with query parameters
 * @returns URLSearchParams string
 * 
 * @example
 * buildQueryParams({ branchId: '123', search: 'test', empty: '' })
 * // Returns: "branchId=123&search=test"
 */
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined, null, and empty string values
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

/**
 * Builds a full API URL with query parameters
 * 
 * @param endpoint - API endpoint (e.g., '/products')
 * @param params - Query parameters object
 * @returns Full URL with query string
 * 
 * @example
 * buildApiUrl('/products', { branchId: '123', search: 'test' })
 * // Returns: "/products?branchId=123&search=test"
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = buildQueryParams(params);
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

/**
 * Type-safe pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for paginated API responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
