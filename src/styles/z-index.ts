/**
 * Standardized z-index scale for the application
 * Use these constants instead of hardcoded values for consistency
 */

export const Z_INDEX = {
  // Base layer
  BASE: 0,
  
  // Content layers
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  
  // Overlay layers
  SIDEBAR_BACKDROP: 40,
  MODAL_BACKDROP: 50,
  MODAL: 50,
  
  // Notification layers
  TOAST: 60,
  TOOLTIP: 70,
  
  // Top layer
  LOADING_OVERLAY: 80,
  CRITICAL_ALERT: 90,
} as const;

export type ZIndex = typeof Z_INDEX[keyof typeof Z_INDEX];
