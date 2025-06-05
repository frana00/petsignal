import apiClient from './api';
import { PAGINATION, ALERT_TYPES, ALERT_STATUS } from '../utils/constants';

/**
 * Gets alerts with pagination and filters
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 0)
 * @param {number} options.size - Page size (default: 20)
 * @param {string} options.type - Alert type (LOST|SEEN)
 * @param {string} options.status - Alert status (ACTIVE|RESOLVED)
 * @returns {Promise<Array>} - Array of alerts
 */
export const getAlerts = async (options = {}) => {
  const params = {
    page: options.page ?? PAGINATION.DEFAULT_PAGE,
    size: options.size ?? PAGINATION.DEFAULT_SIZE,
  };

  // Add optional filters
  if (options.type && Object.values(ALERT_TYPES).includes(options.type)) {
    params.type = options.type;
  }

  if (options.status && Object.values(ALERT_STATUS).includes(options.status)) {
    params.status = options.status;
  }

  const response = await apiClient.get('/alerts', { params });
  return response.data;
};

/**
 * Gets alert by ID
 * @param {number} alertId - The alert ID
 * @returns {Promise<Object>} - Alert data
 */
export const getAlertById = async (alertId) => {
  const response = await apiClient.get(`/alerts/${alertId}`);
  return response.data;
};

/**
 * Creates a new alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} - Created alert data
 */
export const createAlert = async (alertData) => {
  // Clean up undefined values to avoid sending them as null
  // Special handling for username - it should never be filtered out if present
  const cleanData = Object.fromEntries(
    Object.entries(alertData).filter(([key, value]) => {
      // Username is required - never filter it out unless it's null/undefined
      if (key === 'username') {
        return value !== undefined && value !== null;
      }
      // For other fields, filter out undefined, null, and empty strings
      return value !== undefined && value !== null && value !== '';
    })
  );
  
  console.log('📤 Creating alert with data:', cleanData);
  console.log('🔍 Debug: username in alert data:', cleanData.username);
  console.log('🔍 Debug: all keys in alert data:', Object.keys(cleanData));
  
  // Final validation before sending
  if (!cleanData.username) {
    console.error('❌ Critical Error: Username is missing from alert data');
    throw new Error('Username is required but missing from alert data');
  }
  
  const response = await apiClient.post('/alerts', cleanData);
  return response.data;
};

/**
 * Updates an alert
 * @param {number} alertId - The alert ID
 * @param {Object} alertData - Updated alert data
 * @returns {Promise<Object>} - Updated alert data
 */
export const updateAlert = async (alertId, alertData) => {
  // Clean up undefined values to avoid sending them as null
  const cleanData = Object.fromEntries(
    Object.entries(alertData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  );
  
  console.log('📤 Updating alert with data:', cleanData);
  const response = await apiClient.put(`/alerts/${alertId}`, cleanData);
  return response.data;
};

/**
 * Deletes an alert
 * @param {number} alertId - The alert ID
 * @returns {Promise<void>}
 */
export const deleteAlert = async (alertId) => {
  await apiClient.delete(`/alerts/${alertId}`);
};
