import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
}

/**
 * Custom hook for managing pagination state
 * 
 * @param options - Initial pagination configuration
 * @returns Pagination state and control functions
 * 
 * @example
 * const pagination = usePagination({ initialLimit: 20 });
 * 
 * // In query
 * const { data } = useQuery({
 *   queryKey: queryKeys.products.list({ page: pagination.state.page, limit: pagination.state.limit }),
 *   queryFn: () => fetchProducts(pagination.state),
 * });
 * 
 * // In UI
 * <Pagination
 *   meta={data?.pagination}
 *   onPageChange={pagination.setPage}
 *   onLimitChange={pagination.setLimit}
 * />
 */
export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSortBy,
    initialSortOrder = 'desc',
  } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
  });

  const setPage = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const setLimit = (limit: number) => {
    setState((prev) => ({ ...prev, limit, page: 1 })); // Reset to page 1 when limit changes
  };

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    setState((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const toggleSortOrder = () => {
    setState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const nextPage = () => {
    setState((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const prevPage = () => {
    setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  };

  const reset = () => {
    setState({
      page: initialPage,
      limit: initialLimit,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
    });
  };

  return {
    state,
    setPage,
    setLimit,
    setSort,
    toggleSortOrder,
    nextPage,
    prevPage,
    reset,
  };
};

/**
 * Utility to calculate pagination metadata from total count
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export const calculatePaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};
