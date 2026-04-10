import { useState, useEffect } from 'react';

/**
 * Custom hook for debounced search input
 * 
 * Prevents excessive API calls by debouncing user input.
 * Returns both the immediate value (for input control) and debounced value (for queries).
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * 
 * @example
 * const { value, setValue, debouncedValue } = useSearchWithDebounce('', 300);
 * 
 * // In JSX
 * <Input value={value} onChange={(e) => setValue(e.target.value)} />
 * 
 * // In query
 * useQuery({
 *   queryKey: queryKeys.products.list({ search: debouncedValue }),
 *   queryFn: () => fetchProducts(debouncedValue),
 * });
 */
export const useSearchWithDebounce = (initialValue = '', delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return {
    value,
    setValue,
    debouncedValue,
    isDebouncing: value !== debouncedValue,
  };
};
