import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Custom hook for data fetching with loading, error handling, and automatic notifications
 * 
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Object} options - Configuration options
 * @param {boolean} options.loadOnMount - Whether to load data on mount (default: true)
 * @param {boolean} options.showErrorNotification - Whether to show error notifications (default: true)
 * @param {boolean} options.showSuccessNotification - Whether to show success notifications (default: false)
 * @param {string} options.successMessage - Custom success message
 * @param {Array} options.dependencies - Dependencies array for useEffect
 * @returns {Object} Data, loading state, error state, and refetch function
 */
const useFetch = (fetchFunction, options = {}) => {
  const {
    loadOnMount = true,
    showErrorNotification = true,
    showSuccessNotification = false,
    successMessage = 'Data loaded successfully',
    dependencies = [],
  } = options;
  
  const { showError, showSuccess } = useNotification();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction(...args);
      
      setData(result);
      
      if (showSuccessNotification) {
        showSuccess(successMessage);
      }
      
      return result;
    } catch (error) {
      setError(error);
      
      if (showErrorNotification) {
        showError(error.message || 'An error occurred while fetching data');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, showErrorNotification, showSuccessNotification, successMessage, showError, showSuccess]);
  
  useEffect(() => {
    if (loadOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);
  
  return { data, loading, error, refetch: fetchData };
};

export default useFetch; 