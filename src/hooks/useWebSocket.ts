import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth-store';
import { useBranchStore } from '../stores/branch-store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface InventoryUpdate {
  batchId: string;
  productId: string;
  branchId: string;
  quantityAvailable: number;
  updateType: 'sale' | 'purchase' | 'transfer' | 'adjustment' | 'return';
}

interface SaleUpdate {
  saleId: string;
  branchId: string;
  shiftId: string;
  total: number;
  totalFormatted: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentReference?: string;
  items: Array<{
    productId: string;
    batchId: string;
    quantity: number;
  }>;
  updateType: 'completed' | 'returned' | 'partially_returned';
  timestamp: Date;
}

interface UseWebSocketOptions {
  onInventoryUpdate?: (update: InventoryUpdate) => void;
  onSaleUpdate?: (update: SaleUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { accessToken, isAuthenticated } = useAuthStore();
  const { selectedBranch } = useBranchStore();

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated || !accessToken) {
      return;
    }

    // Create socket connection
    const socket = io(WS_URL, {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      
      // Join branch-specific room if branch is selected
      if (selectedBranch) {
        socket.emit('join-branch', selectedBranch._id);
      }
      
      options.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      options.onError?.(error);
    });

    // Inventory update handler
    socket.on('inventory:update', (update: InventoryUpdate) => {
      console.log('Received inventory update:', update);
      options.onInventoryUpdate?.(update);
    });

    // Sale update handler
    socket.on('sale:update', (update: SaleUpdate) => {
      console.log('Received sale update:', update);
      options.onSaleUpdate?.(update);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, accessToken, selectedBranch?._id, 
      options.onConnect, options.onDisconnect, options.onError, options.onInventoryUpdate, options.onSaleUpdate]);

  // Join a specific branch room
  const joinBranch = (branchId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-branch', branchId);
    }
  };

  // Leave a branch room
  const leaveBranch = (branchId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-branch', branchId);
    }
  };

  return {
    isConnected,
    connectionError,
    joinBranch,
    leaveBranch,
  };
};
