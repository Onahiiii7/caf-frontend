import { useToast } from './useToast';

// Legacy alert replacement hook
export const useAlertReplacement = () => {
  const { showError, showWarning, showInfo, showSuccess } = useToast();
  
  // Drop-in replacement for alert() that provides better UX
  const alertError = (message: string) => {
    showError('Error', message);
  };
  
  const alertWarning = (message: string) => {
    showWarning('Warning', message);
  };
  
  const alertInfo = (message: string) => {
    showInfo('Information', message);
  };
  
  const alertSuccess = (message: string) => {
    showSuccess('Success', message);
  };
  
  // Generic alert replacement - tries to determine type from message content
  const alert = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('invalid')) {
      showError('Error', message);
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('please')) {
      showWarning('Warning', message);
    } else if (lowerMessage.includes('success') || lowerMessage.includes('completed')) {
      showSuccess('Success', message);
    } else {
      showInfo('Information', message);
    }
  };
  
  return {
    alert,
    alertError,
    alertWarning,
    alertInfo,
    alertSuccess,
    showError,
    showWarning,
    showInfo,
    showSuccess,
  };
};