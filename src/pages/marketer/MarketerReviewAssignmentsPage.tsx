import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api-client';
import { MarketerLayout } from '../../components/MarketerLayout';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { queryKeys } from '../../lib/query-keys';
import { useCurrency } from '../../hooks/useCurrency';

interface Assignment {
  _id: string;
  productId?: { name?: string; sku?: string };
  assignedQuantity: number;
  assignedUnitPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface AssignmentResponse {
  data: Assignment[];
  count: number;
}

export const MarketerReviewAssignmentsPage = () => {
  const queryClient = useQueryClient();
  const { format } = useCurrency();

  const { data, isLoading } = useQuery<AssignmentResponse>({
    queryKey: queryKeys.marketer.assignments({ activeOnly: true }),
    queryFn: async () => {
      const response = await apiClient.get('/marketer/assignments', { params: { activeOnly: true } });
      return response.data as AssignmentResponse;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/marketer/assignments/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.marketer.all(), exact: false });
    },
  });

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (item: Assignment) => (
        <span>{item.productId?.name || '-'} ({item.productId?.sku || '-'})</span>
      ),
    },
    { key: 'assignedQuantity', header: 'Assigned Qty' },
    {
      key: 'assignedUnitPrice',
      header: 'Unit Price',
      render: (item: Assignment) => <span>{format(item.assignedUnitPrice)}</span>,
    },
    {
      key: 'total',
      header: 'Total Value',
      render: (item: Assignment) => <span className="text-blue-600">{format(item.assignedUnitPrice * item.assignedQuantity)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Assignment) => (
        <span className={item.status === 'accepted' ? 'text-green-600' : 'text-yellow-600'}>{item.status}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: Assignment) => (
        <Button
          size="sm"
          onClick={() => acceptMutation.mutate(item._id)}
          isLoading={acceptMutation.isPending}
          disabled={item.status !== 'pending'}
        >
          Accept
        </Button>
      ),
    },
  ];

  return (
    <MarketerLayout title="Review Product Assignments">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <Table
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No assignments to review"
        />
      </div>
    </MarketerLayout>
  );
};
