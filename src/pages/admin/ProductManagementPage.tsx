import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../../lib/api-client';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Error as ErrorDisplay } from '../../components/ui/Error';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCurrency } from '../../hooks/useCurrency';
import { useBranchStore, getBranchId } from '../../stores/branch-store';
import { queryKeys } from '../../lib/query-keys';
import { buildApiUrl } from '../../lib/api-utils';
import { useSearchWithDebounce } from '../../hooks/useSearchWithDebounce';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { usePagination } from '../../hooks/usePagination';
import { useBranchAwareCRUDMutations } from '../../hooks/useCRUDMutations';

interface PackagingUnit {
  level: number;
  unit: string;
  quantityPerUnit: number;
  barcode?: string;
  sku?: string;
  isSellable: boolean;
  isDefault?: boolean;
  price?: number;
  useAutoPrice?: boolean;
  markupPercentage?: number;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  productType?: 'pharmaceutical' | 'laboratory' | 'general';
  unit: string;
  packaging?: PackagingUnit[];
  reorderLevel: number;
  basePrice: number;
  costPrice: number;
  suggestedRetailPrice: number;
  markupPercentage: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  isActive: boolean;
  maxStockLevel?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
   name: string;
   sku: string;
   barcode: string;
   category: string;
   brand: string;
   productType?: 'pharmaceutical' | 'laboratory' | 'general';
   unit: string;
   packaging?: PackagingUnit[];
   defaultSellableLevel: number;
   initialStock: number;
   initialLotNumber?: string;
   initialExpiryDate?: string;
   initialSupplierId?: string;
   initialPurchasePrice?: number;
   initialSellingPrice?: number;
   basePrice: number;
   costPrice: number;
   suggestedRetailPrice: number;
   markupPercentage: number;
   requiresPrescription: boolean;
   isControlled: boolean;
   branchId: string;
   reorderLevel: number;
   maxStockLevel?: number;
 }

interface Branch {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Supplier {
  _id: string;
  name: string;
}

export const ProductManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const {
    value: searchQuery,
    setValue: setSearchQuery,
    debouncedValue: debouncedSearchQuery,
  } = useSearchWithDebounce('');

  const pagination = usePagination({ initialLimit: 20 });
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const selectedBranch = useBranchStore((state) => state.selectedBranch);
  const branchId = getBranchId(selectedBranch);

  const { createMutation, updateMutation } = useBranchAwareCRUDMutations<Product>(
    'products',
    queryKeys.products.all(),
    branchId || '',
    {
      resourceLabel: 'Product',
      onCreateSuccess: () => {
        setIsModalOpen(false);
      },
      onUpdateSuccess: () => {
        setIsModalOpen(false);
        setEditingProduct(null);
      },
    }
  );

  // WebSocket integration for real-time inventory updates
  useWebSocket({
    onInventoryUpdate: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), exact: false });
    },
  });

  const { register, handleSubmit, reset, watch, trigger, setValue, formState: { errors } } = useForm<ProductFormData>();
  const initialStock = Number(watch('initialStock') || 0);

  const { isAvailable: cameraAvailable, scanOnce } = useBarcodeScanner();

  const handleScanBarcode = async () => {
    const value = await scanOnce();
    if (value) setValue('barcode', value, { shouldValidate: true });
  };

  const generateSku = (name: string): string => {
    const parts = name
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3))
      .filter(Boolean);
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    return parts.slice(0, 3).join('-') + '-' + suffix;
  };

  // Fetch all branches for the branch selector
  const { data: branches } = useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: async () => {
      const response = await apiClient.get('/branches');
      return response.data as Branch[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: async () => {
      const response = await apiClient.get('/suppliers?active=true');
      return response.data as Supplier[];
    },
  });

  // Fetch products for selected branch
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: queryKeys.products.list({
      branchId: branchId,
      search: debouncedSearchQuery,
      ...pagination.state,
    }),
    queryFn: async () => {
      if (!branchId) return null;

      const url = buildApiUrl('/products', {
        branchId,
        search: debouncedSearchQuery,
        ...pagination.state,
      });
      const response = await apiClient.get(url);
      return response.data;
    },
    enabled: !!branchId,
  });

  const products = productsResponse?.data || [];
  const paginationMeta = productsResponse?.pagination;

  // Create product mutation
  const handleCreateProduct = (data: ProductFormData) => {
    if (!data.branchId) {
      throw new Error('Please select a branch');
    }

    const payload = {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      category: data.category,
      brand: data.brand,
      productType: data.productType,
      unit: data.unit,
      packaging: data.packaging,
      defaultSellableLevel: data.defaultSellableLevel,
      reorderLevel: data.reorderLevel,
      basePrice: data.basePrice,
      costPrice: data.costPrice,
      suggestedRetailPrice: data.suggestedRetailPrice,
      markupPercentage: data.markupPercentage,
      requiresPrescription: data.requiresPrescription,
      isControlled: data.isControlled,
      branchId: data.branchId,
      initialStock: data.initialStock,
      initialLotNumber: data.initialLotNumber,
      initialExpiryDate: data.initialExpiryDate,
      initialSupplierId: data.initialSupplierId,
      initialPurchasePrice: data.initialPurchasePrice,
      initialSellingPrice: data.initialSellingPrice,
      maxStockLevel: data.maxStockLevel,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createMutation.mutate(payload);
  };

  // Update product mutation
  const handleUpdateProduct = (data: ProductFormData) => {
    if (!editingProduct) return;

    const payload = {
      name: data.name,
      category: data.category,
      brand: data.brand,
      productType: data.productType,
      unit: data.unit,
      packaging: data.packaging,
      defaultSellableLevel: data.defaultSellableLevel,
      basePrice: data.basePrice,
      costPrice: data.costPrice,
      suggestedRetailPrice: data.suggestedRetailPrice,
      markupPercentage: data.markupPercentage,
      requiresPrescription: data.requiresPrescription,
      isControlled: data.isControlled,
    };

    updateMutation.mutate({ id: editingProduct._id, data: payload });
  };

  const handleOpenModal = (product?: Product) => {
    setWizardStep(1);
    if (product) {
      setEditingProduct(product);
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        brand: product.brand,
        productType: product.productType || 'pharmaceutical',
        unit: product.unit,
        packaging: product.packaging?.map(p => ({
          ...p,
          useAutoPrice: p.price === undefined,
          markupPercentage: p.markupPercentage || 0,
        })) || [{ level: 0, unit: product.unit, quantityPerUnit: 1, isSellable: true, isDefault: true, useAutoPrice: true }],
        defaultSellableLevel: (product as any).defaultSellableLevel || 1,
        initialStock: 0,
        initialLotNumber: '',
        initialExpiryDate: '',
        initialSupplierId: '',
        initialPurchasePrice: product.costPrice || 0,
        initialSellingPrice: product.suggestedRetailPrice || product.basePrice || 0,
        basePrice: product.basePrice || 0,
        costPrice: product.costPrice || 0,
        suggestedRetailPrice: product.suggestedRetailPrice || 0,
        markupPercentage: product.markupPercentage || 0,
        requiresPrescription: product.requiresPrescription,
        isControlled: product.isControlled,
        reorderLevel: product.reorderLevel || 0,
        maxStockLevel: product.maxStockLevel || undefined,
        branchId: '',
      });
    } else {
      setEditingProduct(null);
      const defaultBranchId = getBranchId(selectedBranch) || '';
      reset({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        brand: '',
        productType: 'pharmaceutical',
        unit: 'tablet',
        packaging: [
          { level: 0, unit: 'tablet', quantityPerUnit: 1, isSellable: false, isDefault: false, useAutoPrice: true, markupPercentage: 0 },
          { level: 1, unit: 'card', quantityPerUnit: 10, isSellable: true, isDefault: true, useAutoPrice: true, markupPercentage: 100 },
          { level: 2, unit: 'pack', quantityPerUnit: 4, isSellable: true, isDefault: false, useAutoPrice: true, markupPercentage: 300 },
          { level: 3, unit: 'box', quantityPerUnit: 10, isSellable: true, isDefault: false, useAutoPrice: true, markupPercentage: 500 },
        ],
        defaultSellableLevel: 1,
        initialStock: 0,
        initialLotNumber: '',
        initialExpiryDate: '',
        initialSupplierId: '',
        initialPurchasePrice: 0,
        initialSellingPrice: 0,
        basePrice: 0,
        costPrice: 0,
        suggestedRetailPrice: 0,
        markupPercentage: 0,
        requiresPrescription: false,
        isControlled: false,
        branchId: defaultBranchId,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setWizardStep(1);
    reset();
  };

  const handleNextStep = async () => {
    const valid = await trigger([
      'branchId',
      'name',
      'barcode',
      'category',
      'brand',
      'unit',
      'basePrice',
      'costPrice',
      'suggestedRetailPrice',
      'markupPercentage',
    ]);

    if (valid) {
      setWizardStep(2);
    }
  };

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      handleUpdateProduct(data);
    } else {
      handleCreateProduct(data);
    }
  };

  if (isLoading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><ErrorDisplay message="Failed to load products" /></AdminLayout>;

  const columns = [
    { key: 'name', header: 'Product Name' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    { key: 'brand', header: 'Brand' },
    { 
      key: 'basePrice', 
      header: 'Base Price',
      render: (product: Product) => format(product.basePrice || 0)
    },
    { 
      key: 'costPrice', 
      header: 'Cost Price',
      render: (product: Product) => format(product.costPrice || 0)
    },
    { 
      key: 'markupPercentage', 
      header: 'Markup',
      render: (product: Product) => 
        product.markupPercentage ? `${product.markupPercentage}%` : '-'
    },
    { key: 'unit', header: 'Unit' },
    {
      key: 'requiresPrescription',
      header: 'Prescription',
      render: (product: Product) => (
        product.requiresPrescription ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Required
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Not Required
          </span>
        )
      ),
    },
    {
      key: 'isControlled',
      header: 'Controlled',
      render: (product: Product) => (
        product.isControlled ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            Yes
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
            No
          </span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenModal(product)}
          className="py-1!"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Products</h2>
            <p className="text-gray-400 mt-1">Manage product catalog and inventory</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-accent-green/20">
            Add Product
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-primary-dark/50 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Products Table */}
        <div className="rounded-2xl overflow-hidden border border-white/5 shadow-xl">
          <Table
            data={products}
            columns={columns}
            isLoading={isLoading}
            pagination={paginationMeta}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
            onSort={(key) => {
              if (pagination.state.sortBy === key) {
                pagination.toggleSortOrder();
              } else {
                pagination.setSort(key, 'asc');
              }
            }}
            currentSort={{
              key: pagination.state.sortBy || '',
              order: pagination.state.sortOrder || 'asc',
            }}
            emptyMessage="No products found"
          />
        </div>

        {/* Product Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!editingProduct ? (
              <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300">
                  <span className={wizardStep === 1 ? 'text-accent-green font-semibold' : ''}>Step 1: Product Details</span>
                  <span className={wizardStep === 2 ? 'text-accent-green font-semibold' : ''}>Step 2: Opening Stock</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full bg-accent-green transition-all duration-300 ${wizardStep === 1 ? 'w-1/2' : 'w-full'}`}
                  ></div>
                </div>
              </div>
            ) : null}

            {/* Branch Selector - Only show when creating new product */}
            {!editingProduct && wizardStep === 1 && (
              <div className="p-4 bg-accent-green/5 border border-accent-green/20 rounded-xl">
                <Select
                  label="Select Branch"
                  {...register('branchId', { required: 'Branch is required' })}
                  error={errors.branchId?.message}
                >
                  <option value="" className="bg-primary-dark text-white">Choose a branch...</option>
                  {branches?.filter(b => b.isActive).map((branch) => (
                    <option key={branch._id} value={branch._id} className="bg-primary-dark text-white">
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-gray-400">
                  Select which branch this product will be added to
                </p>
              </div>
            )}

            {(editingProduct || wizardStep === 1) ? (
              <>
                <Input
                  label="Product Name"
                  {...register('name', { required: 'Product name is required' })}
                  error={errors.name?.message}
                  onChange={(e) => {
                    const el = e.target;
                    register('name').onChange(e);
                    if (!editingProduct) {
                      setValue('sku', generateSku(el.value), { shouldValidate: false });
                    }
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="SKU"
                    {...register('sku')}
                    error={errors.sku?.message}
                    disabled={!!editingProduct}
                    placeholder="Auto-generated from name"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="block text-sm font-medium text-gray-300">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        {...register('barcode', { required: 'Barcode is required' })}
                        disabled={!!editingProduct}
                        className="flex-1 px-4 py-2.5 bg-primary-darker border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        placeholder="Scan or type barcode"
                      />
                      {cameraAvailable && !editingProduct && (
                        <button
                          type="button"
                          onClick={handleScanBarcode}
                          className="px-3 py-2.5 bg-accent-green/10 border border-accent-green/30 rounded-xl text-accent-green hover:bg-accent-green/20 transition-colors"
                          title="Scan barcode with camera"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-12h-3a1 1 0 00-1 1v3" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {errors.barcode && <p className="text-sm text-red-400">{errors.barcode.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Select
                    label="Category"
                    {...register('category', { required: 'Category is required' })}
                    error={errors.category?.message}
                  >
                    <option value="" className="bg-primary-dark text-white">Select Category</option>
                    <option value="prescription" className="bg-primary-dark text-white">Prescription Drugs</option>
                    <option value="otc" className="bg-primary-dark text-white">Over-the-Counter (OTC)</option>
                    <option value="vitamins" className="bg-primary-dark text-white">Vitamins & Supplements</option>
                    <option value="medical-devices" className="bg-primary-dark text-white">Medical Devices</option>
                    <option value="personal-care" className="bg-primary-dark text-white">Personal Care</option>
                    <option value="baby-care" className="bg-primary-dark text-white">Baby & Child Care</option>
                    <option value="first-aid" className="bg-primary-dark text-white">First Aid</option>
                    <option value="diabetic-care" className="bg-primary-dark text-white">Diabetic Care</option>
                    <option value="cosmetics" className="bg-primary-dark text-white">Cosmetics</option>
                    <option value="laboratory" className="bg-primary-dark text-white">Laboratory/Reagents</option>
                    <option value="other" className="bg-primary-dark text-white">Other</option>
                  </Select>
                  <Select
                    label="Product Type"
                    {...register('productType')}
                    error={errors.productType?.message}
                  >
                    <option value="pharmaceutical" className="bg-primary-dark text-white">Pharmaceutical</option>
                    <option value="laboratory" className="bg-primary-dark text-white">Laboratory</option>
                    <option value="general" className="bg-primary-dark text-white">General</option>
                  </Select>
                  <Input
                    label="Brand"
                    {...register('brand', { required: 'Brand is required' })}
                    error={errors.brand?.message}
                  />
                </div>

                <Select
                  label="Base Unit of Measurement"
                  {...register('unit', { required: 'Unit is required' })}
                  error={errors.unit?.message}
                >
                  <option value="" className="bg-primary-dark text-white">Select Unit</option>
                  <option value="tablet" className="bg-primary-dark text-white">Tablet</option>
                  <option value="capsule" className="bg-primary-dark text-white">Capsule</option>
                  <option value="bottle" className="bg-primary-dark text-white">Bottle</option>
                  <option value="vial" className="bg-primary-dark text-white">Vial</option>
                  <option value="ampule" className="bg-primary-dark text-white">Ampule</option>
                  <option value="syringe" className="bg-primary-dark text-white">Syringe</option>
                  <option value="tube" className="bg-primary-dark text-white">Tube</option>
                  <option value="jar" className="bg-primary-dark text-white">Jar</option>
                  <option value="pack" className="bg-primary-dark text-white">Pack</option>
                  <option value="box" className="bg-primary-dark text-white">Box</option>
                  <option value="strip" className="bg-primary-dark text-white">Strip/Blister</option>
                  <option value="sachet" className="bg-primary-dark text-white">Sachet</option>
                  <option value="ml" className="bg-primary-dark text-white">Milliliter (ml)</option>
                  <option value="mg" className="bg-primary-dark text-white">Milligram (mg)</option>
                  <option value="g" className="bg-primary-dark text-white">Gram (g)</option>
                  <option value="piece" className="bg-primary-dark text-white">Piece</option>
                  <option value="roll" className="bg-primary-dark text-white">Roll</option>
                  <option value="set" className="bg-primary-dark text-white">Set</option>
                  <option value="pair" className="bg-primary-dark text-white">Pair</option>
                </Select>

                {/* Packaging Configuration */}
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-sm font-semibold text-white">Packaging Hierarchy & Pricing</h3>
                  <p className="text-xs text-gray-400">Configure how this product is packaged and sold. Mark sellable units below.</p>

                  {/* Packaging Levels Table */}
                  <div className="space-y-3">
                    {watch('packaging')?.map((pack, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-[--color-primary-dark] rounded-lg">
                        <div className="col-span-1 text-xs text-gray-400 text-center">
                          L{index}
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Unit name"
                            value={pack.unit}
                            onChange={(e) => {
                              const newPackaging = [...(watch('packaging') || [])];
                              newPackaging[index].unit = e.target.value;
                              setValue('packaging', newPackaging);
                            }}
                            className="!py-1 !text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={pack.quantityPerUnit}
                            onChange={(e) => {
                              const newPackaging = [...(watch('packaging') || [])];
                              newPackaging[index].quantityPerUnit = parseInt(e.target.value) || 1;
                              setValue('packaging', newPackaging);
                            }}
                            className="!py-1 !text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            checked={pack.isSellable}
                            onChange={(e) => {
                              const newPackaging = [...(watch('packaging') || [])];
                              newPackaging[index].isSellable = e.target.checked;
                              if (e.target.checked && !newPackaging.some(p => p.isDefault)) {
                                newPackaging[index].isDefault = true;
                              }
                              setValue('packaging', newPackaging);
                            }}
                            className="h-4 w-4 rounded border-gray-600 bg-primary-darker text-accent-green focus:ring-accent-green"
                          />
                          <span className="ml-2 text-xs text-gray-300">Sell</span>
                        </div>
                        <div className="col-span-3 flex items-center">
                          <input
                            type="checkbox"
                            checked={pack.isDefault || false}
                            disabled={!pack.isSellable}
                            onChange={(e) => {
                              const newPackaging = [...(watch('packaging') || [])];
                              newPackaging.forEach((p, i) => {
                                p.isDefault = i === index ? e.target.checked : false;
                              });
                              setValue('packaging', newPackaging);
                              if (e.target.checked) {
                                setValue('defaultSellableLevel', index);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-600 bg-primary-darker text-accent-green focus:ring-accent-green disabled:opacity-50"
                          />
                          <span className="ml-2 text-xs text-gray-300">Default</span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPackaging = [...(watch('packaging') || [])];
                                newPackaging.splice(index, 1);
                                newPackaging.forEach((p, i) => p.level = i);
                                setValue('packaging', newPackaging);
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Packaging Level */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentPackaging = watch('packaging') || [];
                      const newLevel = currentPackaging.length;
                      setValue('packaging', [
                        ...currentPackaging,
                        { level: newLevel, unit: '', quantityPerUnit: 10, isSellable: true, isDefault: false, useAutoPrice: true, markupPercentage: 100 }
                      ]);
                    }}
                    className="text-sm text-accent-green hover:text-accent-green/80 flex items-center gap-2"
                  >
                    <span>+</span> Add Packaging Level
                  </button>

                  {/* Quick Presets */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('packaging', [
                          { level: 0, unit: 'tablet', quantityPerUnit: 1, isSellable: false, isDefault: false, useAutoPrice: true, markupPercentage: 0 },
                          { level: 1, unit: 'card', quantityPerUnit: 10, isSellable: true, isDefault: true, useAutoPrice: true, markupPercentage: 100 },
                          { level: 2, unit: 'pack', quantityPerUnit: 4, isSellable: true, isDefault: false, useAutoPrice: true, markupPercentage: 300 },
                          { level: 3, unit: 'box', quantityPerUnit: 10, isSellable: true, isDefault: false, useAutoPrice: true, markupPercentage: 500 },
                        ]);
                        setValue('defaultSellableLevel', 1);
                      }}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                    >
                      Tab → Card → Pack → Box
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('packaging', [
                          { level: 0, unit: 'ml', quantityPerUnit: 1, isSellable: false, isDefault: false, useAutoPrice: true, markupPercentage: 0 },
                          { level: 1, unit: 'bottle', quantityPerUnit: 500, isSellable: true, isDefault: true, useAutoPrice: true, markupPercentage: 100 },
                        ]);
                        setValue('defaultSellableLevel', 1);
                      }}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                    >
                      ml → Bottle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('packaging', [
                          { level: 0, unit: 'piece', quantityPerUnit: 1, isSellable: true, isDefault: true, useAutoPrice: true, markupPercentage: 0 },
                        ]);
                        setValue('defaultSellableLevel', 0);
                      }}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                    >
                      Single Item Only
                    </button>
                  </div>
                </div>

                {/* Pricing Preview based on Base Price */}
                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-sm font-semibold text-white">Pricing Preview</h3>
                  <p className="text-xs text-gray-400">Prices auto-calculated from base price and markup. Edit markup to adjust.</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {watch('packaging')?.filter(p => p.isSellable).map((pack, idx) => {
                      const baseQty = watch('packaging')?.slice(0, pack.level).reduce((acc, p) => acc * p.quantityPerUnit, 1) || 1;
                      const totalBaseUnits = baseQty * pack.quantityPerUnit;
                      const calculatedPrice = watch('basePrice') ? (watch('basePrice') * (1 + (pack.markupPercentage || 0) / 100) * totalBaseUnits).toFixed(2) : '0.00';
                      return (
                        <div key={idx} className="p-2 bg-primary-dark rounded border border-gray-700">
                          <p className="text-xs text-gray-400">{pack.unit}</p>
                          <p className="text-sm font-bold text-accent-green">₦{calculatedPrice}</p>
                          <p className="text-xs text-gray-500">+{(pack.markupPercentage || 0)}% markup</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Base Price (Le)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('basePrice', {
                      required: 'Base price is required',
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.basePrice?.message}
                  />

                  <Input
                    label="Cost Price (Le)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('costPrice', {
                      required: 'Cost price is required',
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.costPrice?.message}
                  />

                  <Input
                    label="Suggested Retail Price (Le)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('suggestedRetailPrice', {
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.suggestedRetailPrice?.message}
                  />

                  <Input
                    label="Markup Percentage (%)"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    {...register('markupPercentage', {
                      min: { value: 0, message: 'Must be 0 or greater' },
                      max: { value: 1000, message: 'Maximum 1000%' },
                    })}
                    error={errors.markupPercentage?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Reorder Level"
                    type="number"
                    min="0"
                    {...register('reorderLevel', {
                      required: 'Reorder level is required',
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.reorderLevel?.message}
                  />

                  <Input
                    label="Maximum Stock Level (Optional)"
                    type="number"
                    min="0"
                    {...register('maxStockLevel', {
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.maxStockLevel?.message}
                  />
                </div>

                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiresPrescription"
                      {...register('requiresPrescription')}
                      className="h-5 w-5 rounded border-gray-600 bg-primary-darker text-accent-green focus:ring-accent-green transition-colors"
                    />
                    <label htmlFor="requiresPrescription" className="ml-3 block text-sm font-medium text-white">
                      Requires Prescription
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isControlled"
                      {...register('isControlled')}
                      className="h-5 w-5 rounded border-gray-600 bg-primary-darker text-accent-green focus:ring-accent-green transition-colors"
                    />
                    <label htmlFor="isControlled" className="ml-3 block text-sm font-medium text-white">
                      Controlled Substance
                    </label>
                  </div>
                </div>
              </>
            ) : null}

            {!editingProduct && wizardStep === 2 ? (
              <div>
                <Input
                  label="Initial Stock Quantity"
                  type="number"
                  min="0"
                  {...register('initialStock', {
                    required: 'Initial stock quantity is required',
                    min: { value: 0, message: 'Must be 0 or greater' },
                  })}
                  error={errors.initialStock?.message}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Starting inventory quantity for this product when first added to the system.
                </p>
              </div>
            ) : null}

            {!editingProduct && wizardStep === 2 && initialStock > 0 ? (
              <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="text-sm font-semibold text-white">Opening Stock Batch Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Supplier"
                    {...register('initialSupplierId', {
                      required: 'Supplier is required when opening stock is provided',
                    })}
                    error={errors.initialSupplierId?.message}
                  >
                    <option value="" className="bg-primary-dark text-white">Select Supplier</option>
                    {suppliers?.map((supplier) => (
                      <option key={supplier._id} value={supplier._id} className="bg-primary-dark text-white">
                        {supplier.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Expiry Date"
                    type="date"
                    {...register('initialExpiryDate', {
                      required: 'Expiry date is required when opening stock is provided',
                    })}
                    error={errors.initialExpiryDate?.message}
                  />

                  <Input
                    label="Lot Number (Optional)"
                    {...register('initialLotNumber')}
                    placeholder="Auto-generated if left empty"
                    error={errors.initialLotNumber?.message}
                  />

                  <Input
                    label="Opening Purchase Price (Optional)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('initialPurchasePrice', {
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.initialPurchasePrice?.message}
                    placeholder="Defaults to Cost Price"
                  />

                  <Input
                    label="Opening Selling Price (Optional)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('initialSellingPrice', {
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    error={errors.initialSellingPrice?.message}
                    placeholder="Defaults to Suggested Retail or Base Price"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>

              {!editingProduct && wizardStep === 1 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next
                </Button>
              ) : null}

              {!editingProduct && wizardStep === 2 ? (
                <>
                  <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Saving...' : 'Create Product'}
                  </Button>
                </>
              ) : null}

              {editingProduct ? (
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Update Product'}
                </Button>
              ) : null}
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <ErrorDisplay message="Failed to save product. Please try again." />
            )}
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};


