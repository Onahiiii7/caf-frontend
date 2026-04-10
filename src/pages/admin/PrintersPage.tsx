import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Plus, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';
import { AdminLayout } from '../../components/AdminLayout';
import { useToast } from '../../hooks/useToast';

interface PrinterConfig {
  _id: string;
  branchId: {
    _id: string;
    name: string;
  };
  terminalId: string;
  name: string;
  model: string;
  connectionType: string;
  paperWidth: number;
  ipAddress?: string;
  port?: number;
  bluetoothName?: string;
  autoPrintEnabled: boolean;
  defaultCopies: number;
  isActive: boolean;
  lastTestAt?: string;
  lastTestStatus?: 'success' | 'failed';
  lastTestError?: string;
}

export const PrintersPage: React.FC = () => {
  const navigate = useNavigate();
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/printers');
      setPrinters(response.data);
    } catch (error) {
      console.error('Failed to load printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (id: string) => {
    setTesting(id);
    try {
      const response = await apiClient.post(`/printers/${id}/test`);
      showSuccess(response.data.message ?? 'Printer test successful');
      await loadPrinters();
    } catch {
      showError('Failed to test printer connection');
    } finally {
      setTesting(null);
    }
  };

  const deletePrinter = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this printer?')) return;

    try {
      await apiClient.delete(`/printers/${id}`);
      showSuccess('Printer deleted');
      await loadPrinters();
    } catch {
      showError('Failed to delete printer');
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'bluetooth':
        return '📱';
      case 'usb':
        return '🔌';
      case 'serial':
        return '🔗';
      default:
        return '🖨️';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading printers...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Printer className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Thermal Printers</h1>
        </div>
        <button
          onClick={() => navigate('/admin/printers/new')}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span>Add Printer</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">📱 Mobile & Web Compatibility</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>Network Printers:</strong> Work on all devices (Windows, Mac,
            Android, iOS)
          </p>
          <p>
            <strong>Bluetooth Printers:</strong> Mobile only (Android with Chrome
            98+)
          </p>
          <p>
            <strong>USB/Serial Printers:</strong> Desktop only (Chrome/Edge with Web
            Serial API)
          </p>
        </div>
      </div>

      {printers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No printers configured</p>
          <button
            onClick={() => navigate('/admin/printers/new')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Add Your First Printer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <div
              key={printer._id}
              className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {getConnectionIcon(printer.connectionType)}
                  </span>
                  <div>
                    <h3 className="font-semibold">{printer.name}</h3>
                    <p className="text-xs text-gray-500">
                      {typeof printer.branchId === 'object'
                        ? printer.branchId.name
                        : 'Unknown Branch'}{' '}
                      - {printer.terminalId}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    printer.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {printer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {printer.connectionType}
                  </span>
                </div>

                {printer.connectionType === 'network' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">
                      {printer.ipAddress}:{printer.port}
                    </span>
                  </div>
                )}

                {printer.connectionType === 'bluetooth' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Device:</span>
                    <span className="font-medium">{printer.bluetoothName}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Paper:</span>
                  <span className="font-medium">{printer.paperWidth}mm</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-print:</span>
                  <span className="font-medium">
                    {printer.autoPrintEnabled
                      ? `Yes (${printer.defaultCopies}x)`
                      : 'No'}
                  </span>
                </div>

                {printer.lastTestAt && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Last Test:</span>
                    <div className="flex items-center space-x-1">
                      {printer.lastTestStatus === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${
                          printer.lastTestStatus === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {new Date(printer.lastTestAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => testConnection(printer._id)}
                  disabled={testing === printer._id}
                  className="flex-1 flex items-center justify-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testing === printer._id ? 'Testing...' : 'Test'}</span>
                </button>
                <button
                  onClick={() => deletePrinter(printer._id)}
                  className="p-2 border rounded hover:bg-red-50 hover:border-red-300 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {printer.lastTestError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {printer.lastTestError}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </AdminLayout>
  );
};
