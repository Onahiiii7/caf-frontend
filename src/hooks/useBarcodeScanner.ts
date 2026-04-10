import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

type ScanListener = { remove: () => Promise<void> };

/**
 * Lazy-loads the ML Kit barcode scanner only on native platforms.
 * Avoids bundling native code on web.
 */
async function getScanner() {
  if (!Capacitor.isNativePlatform()) return null;
  const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
  return BarcodeScanner;
}

/**
 * Hook for barcode scanning via the device rear camera.
 *
 * - `scanOnce()`: Opens the native scanner UI, waits for one scan, returns the value.
 * - `startContinuousScan(cb)`: Starts a transparent camera overlay; fires cb on every scan.
 *   Caller must call `stopContinuousScan()` to shut down.
 * - Only active on native (Android/iOS). Returns `isAvailable = false` on web.
 */
export function useBarcodeScanner() {
  const listenerRef = useRef<ScanListener | null>(null);
  const scanningRef = useRef(false);

  const isAvailable = Capacitor.isNativePlatform();

  const requestPermission = async (): Promise<boolean> => {
    const scanner = await getScanner();
    if (!scanner) return false;
    const { camera } = await scanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  };

  /**
   * Opens the native full-screen scanner, resolves with the scanned barcode value.
   * Returns null if unavailable, permission denied, or user cancels.
   */
  const scanOnce = async (): Promise<string | null> => {
    const scanner = await getScanner();
    if (!scanner) return null;

    const ok = await requestPermission();
    if (!ok) return null;

    try {
      const { barcodes } = await scanner.scan();
      return barcodes[0]?.rawValue ?? null;
    } catch {
      return null;
    }
  };

  /**
   * Starts a continuous scan. Makes the WebView background transparent so the
   * camera shows through. HTML elements on top remain visible.
   * @param onScan Called each time a barcode is detected, with the raw value.
   */
  const startContinuousScan = useCallback(async (onScan: (value: string) => void) => {
    if (scanningRef.current) return;
    const scanner = await getScanner();
    if (!scanner) return;

    const ok = await requestPermission();
    if (!ok) return;

    document.body.classList.add('barcode-scan-active');
    scanningRef.current = true;

    await scanner.startScan();

    listenerRef.current = await scanner.addListener('barcodesScanned', (event: any) => {
      const value = event.barcode?.rawValue;
      if (value) onScan(value);
    });
  }, []);

  /**
   * Stops the continuous scan and restores the WebView background.
   */
  const stopContinuousScan = useCallback(async () => {
    const scanner = await getScanner();
    if (!scanner) return;

    try {
      await listenerRef.current?.remove();
      listenerRef.current = null;
      await scanner.stopScan();
    } finally {
      document.body.classList.remove('barcode-scan-active');
      scanningRef.current = false;
    }
  }, []);

  return { isAvailable, scanOnce, startContinuousScan, stopContinuousScan };
}
