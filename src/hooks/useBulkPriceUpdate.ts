import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';

interface BulkPriceUpdateItem {
  batchId: string;
  newSellingPrice: number;
}

interface BulkPriceUpdateRequest {
  updates: BulkPriceUpdateItem[];
}

export const useBulkPriceUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkPriceUpdateRequest) => {
      const promises = request.updates.map(({ batchId, newSellingPrice }) =>
        apiClient.patch(`/batches/${batchId}`, { sellingPrice: newSellingPrice })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate and refetch batch-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all(), exact: false });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), exact: false });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all(), exact: false });
    },
    onError: (error) => {
      console.error('Bulk price update failed:', error);
    },
  });
};

export default useBulkPriceUpdate;