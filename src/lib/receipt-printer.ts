import apiClient from './api-client';

export interface PrinterConfig {
  id: string;
  branchId: string;
  terminalId: string;
  name: string;
  model: 'epson' | 'star' | 'bixolon' | 'citizen' | 'generic_esc_pos';
  connectionType: 'usb' | 'network' | 'bluetooth' | 'serial';
  paperWidth: 58 | 80;
  ipAddress?: string;
  port?: number;
  bluetoothAddress?: string;
  bluetoothName?: string;
  autoPrintEnabled: boolean;
  defaultCopies: number;
}

export interface ReceiptPrintOptions {
  saleId: string;
  format: 'pdf' | 'thermal';
  thermalWidth?: 58 | 80;
  printerConfig?: PrinterConfig;
}

/**
 * Detect if running on mobile device
 */
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

/**
 * Get printer configuration for current terminal
 */
export const getPrinterConfig = async (
  branchId: string,
  terminalId: string,
): Promise<PrinterConfig | null> => {
  try {
    const response = await apiClient.get(
      `/printers/terminal/${branchId}/${terminalId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get printer config:', error);
    return null;
  }
};

/**
 * Download PDF receipt
 */
export const downloadPDFReceipt = async (saleId: string): Promise<void> => {
  try {
    const response = await apiClient.get(`/sales/${saleId}/receipt/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${saleId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF receipt:', error);
    throw new Error('Failed to download receipt');
  }
};

/**
 * Print PDF receipt
 * - Desktop: Opens print dialog
 * - Mobile: Uses share API or downloads
 */
export const printPDFReceipt = async (saleId: string): Promise<void> => {
  try {
    const response = await apiClient.get(`/sales/${saleId}/receipt/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Mobile: Use Web Share API if available
    if (isMobile() && navigator.share) {
      const file = new File([blob], `receipt-${saleId}.pdf`, {
        type: 'application/pdf',
      });

      await navigator.share({
        title: 'Receipt',
        text: `Receipt #${saleId}`,
        files: [file],
      });
      return;
    }

    // Desktop: Open print dialog
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error('Failed to print PDF receipt:', error);
    throw new Error('Failed to print receipt');
  }
};

/**
 * Send to thermal printer via browser's print API
 * Note: Requires thermal printer driver installed and configured
 */
export const sendToThermalPrinter = async (
  saleId: string,
  width: 58 | 80 = 80,
): Promise<void> => {
  try {
    const response = await apiClient.get(
      `/sales/${saleId}/receipt/thermal?width=${width}`,
      {
        responseType: 'blob',
      },
    );

    // For thermal printers with USB/network drivers
    // This creates a download that can be sent to the printer
    const blob = new Blob([response.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${saleId}.bin`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to send to thermal printer:', error);
    throw new Error('Failed to print to thermal printer');
  }
};

/**
 * Print to thermal printer - handles both desktop and mobile
 */
export const printToThermalPrinter = async (
  saleId: string,
  config: PrinterConfig,
): Promise<void> => {
  try {
    const { connectionType, paperWidth, ipAddress, port } = config;

    // Get thermal receipt data
    const response = await apiClient.get(
      `/sales/${saleId}/receipt/thermal?width=${paperWidth}`,
      {
        responseType: 'arraybuffer',
      },
    );

    const data = new Uint8Array(response.data);

    // NETWORK PRINTER (works on all platforms)
    if (connectionType === 'network' && ipAddress && port) {
      // Send to network printer via backend proxy
      await apiClient.post(`/printers/network/print`, {
        ipAddress,
        port,
        data: Array.from(data),
      });
      return;
    }

    // BLUETOOTH PRINTER (mobile only)
    if (connectionType === 'bluetooth' && isMobile()) {
      if (!('bluetooth' in navigator)) {
        throw new Error('Bluetooth not supported on this device');
      }

      // Request Bluetooth device
      const device = await (navigator as Navigator & { bluetooth: any }).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // ESC/POS service
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(
        '000018f0-0000-1000-8000-00805f9b34fb',
      );
      const characteristic = await service.getCharacteristic(
        '00002af1-0000-1000-8000-00805f9b34fb',
      );

      // Send data in chunks (Bluetooth has packet size limits)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
      }

      device.gatt.disconnect();
      return;
    }

    // USB/SERIAL PRINTER (desktop only with Web Serial API)
    if (
      (connectionType === 'usb' || connectionType === 'serial') &&
      !isMobile()
    ) {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      const port = await (navigator as Navigator & { serial: any }).serial.requestPort();
      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      await port.close();
      return;
    }

    throw new Error(
      `Connection type ${connectionType} not supported on this platform`,
    );
  } catch (error) {
    console.error('Failed to print to thermal printer:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to print to thermal printer',
    );
  }
};

/**
 * Print receipt using Web Serial API (for direct USB thermal printers)
 * Requires user permission and Chrome/Edge browser
 */
export const printToSerialThermalPrinter = async (
  saleId: string,
  width: 58 | 80 = 80,
): Promise<void> => {
  try {
    // Check if Web Serial API is available
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser');
    }

    // Get thermal printer data
    const response = await apiClient.get(
      `/sales/${saleId}/receipt/thermal?width=${width}`,
      {
        responseType: 'arraybuffer',
      },
    );

    // Request serial port (user must select printer)
    const port = await (navigator as Navigator & { serial: any }).serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Write data to printer
    const writer = port.writable.getWriter();
    await writer.write(new Uint8Array(response.data));
    writer.releaseLock();

    // Close port
    await port.close();
  } catch (error) {
    console.error('Failed to print via serial:', error);
    throw new Error('Failed to connect to thermal printer');
  }
};

/**
 * Auto-print receipt if configured
 */
export const autoPrintReceipt = async (
  saleId: string,
  branchId: string,
  terminalId: string,
): Promise<void> => {
  const config = await getPrinterConfig(branchId, terminalId);

  if (!config || !config.autoPrintEnabled) {
    return;
  }

  // Print multiple copies if configured
  for (let i = 0; i < config.defaultCopies; i++) {
    await printToThermalPrinter(saleId, config);
  }
};
