/**
 * Composable for handling toast notifications
 * Provides a unified interface for showing different types of notifications
 */
import { toast as toastService } from '@/store/modules/ui';

export function useToast() {
  // Default options for different toast types
  const defaultOptions = {
    success: {
      duration: 3000,
      position: 'top-right'
    },
    error: {
      duration: 5000,
      position: 'top-right'
    },
    warning: {
      duration: 4000,
      position: 'top-right'
    },
    info: {
      duration: 3000,
      position: 'top-right'
    }
  };
  
  // Basic toast methods
  function success(message, options = {}) {
    const finalOptions = { ...defaultOptions.success, ...options };
    return toastService.success(message, finalOptions);
  }
  
  function error(message, options = {}) {
    const finalOptions = { ...defaultOptions.error, ...options };
    return toastService.error(message, finalOptions);
  }
  
  function warning(message, options = {}) {
    const finalOptions = { ...defaultOptions.warning, ...options };
    return toastService.warning(message, finalOptions);
  }
  
  function info(message, options = {}) {
    const finalOptions = { ...defaultOptions.info, ...options };
    return toastService.info(message, finalOptions);
  }
  
  // Specialized toast methods for common use cases
  function apiSuccess(action = 'Operation') {
    return success(`${action} completed successfully`);
  }
  
  function apiError(action = 'Operation', error = null) {
    const message = error?.message || `${action} failed`;
    return error(message);
  }
  
  function validationError(message = 'Please check your input') {
    return error(message);
  }
  
  function networkError() {
    return error('Network error. Please check your connection and try again.');
  }
  
  function authError(message = 'Authentication required') {
    return error(message);
  }
  
  function permissionError(action = 'perform this action') {
    return error(`You don't have permission to ${action}`);
  }
  
  // Loading toast (for long operations)
  function loading(message = 'Loading...', options = {}) {
    const finalOptions = {
      duration: 0, // Don't auto-dismiss
      showClose: true,
      ...options
    };
    return info(message, finalOptions);
  }
  
  // Progress toast (with percentage)
  function progress(message, percentage, options = {}) {
    const progressMessage = `${message} (${percentage}%)`;
    return loading(progressMessage, options);
  }
  
  // Confirmation-style toast (with action buttons)
  function confirm(message, onConfirm, onCancel = null, options = {}) {
    const finalOptions = {
      duration: 0,
      showClose: true,
      actions: [
        {
          text: 'Yes',
          onClick: onConfirm,
          style: 'primary'
        },
        {
          text: 'No',
          onClick: onCancel || (() => {}),
          style: 'secondary'
        }
      ],
      ...options
    };
    return warning(message, finalOptions);
  }
  
  // Batch operations
  function batchSuccess(count, itemType = 'items') {
    return success(`Successfully processed ${count} ${itemType}`);
  }
  
  function batchError(successCount, failCount, itemType = 'items') {
    return warning(`Processed ${successCount} ${itemType}, ${failCount} failed`);
  }
  
  // Clear all toasts
  function clear() {
    return toastService.clear();
  }
  
  // Handle API response patterns
  function handleApiResponse(response, successMessage = null, errorMessage = null) {
    if (response.success) {
      if (successMessage) {
        success(successMessage);
      }
    } else {
      const message = errorMessage || response.message || 'An error occurred';
      error(message);
    }
    return response;
  }
  
  // Handle async operations with automatic toasts
  async function withToast(
    asyncFn,
    {
      loadingMessage = 'Processing...',
      successMessage = null,
      errorMessage = null,
      showLoading = false
    } = {}
  ) {
    let loadingToast = null;
    
    try {
      if (showLoading) {
        loadingToast = loading(loadingMessage);
      }
      
      const result = await asyncFn();
      
      if (loadingToast) {
        toastService.dismiss(loadingToast);
      }
      
      if (successMessage) {
        success(successMessage);
      }
      
      return result;
    } catch (error) {
      if (loadingToast) {
        toastService.dismiss(loadingToast);
      }
      
      const message = errorMessage || error.message || 'An error occurred';
      error(message);
      
      throw error;
    }
  }
  
  return {
    // Basic methods
    success,
    error,
    warning,
    info,
    
    // Specialized methods
    apiSuccess,
    apiError,
    validationError,
    networkError,
    authError,
    permissionError,
    
    // Advanced methods
    loading,
    progress,
    confirm,
    
    // Batch methods
    batchSuccess,
    batchError,
    
    // Utility methods
    clear,
    handleApiResponse,
    withToast,
    
    // Direct access to toast service for advanced usage
    service: toastService
  };
}
