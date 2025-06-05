import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getAlerts, getAlertById, createAlert, updateAlert, deleteAlert } from '../services/alerts';
import { ALERT_TYPES, ALERT_STATUS } from '../utils/constants';

// Initial state
const initialState = {
  alerts: [], // Ensure this is always an array
  currentAlert: null,
  loading: false,
  error: null,
  filters: {
    type: null,
    status: ALERT_STATUS.ACTIVE,
  },
  pagination: {
    page: 0,
    size: 20,
    hasMore: true,
  },
  refreshing: false,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_ERROR: 'SET_ERROR',
  SET_ALERTS: 'SET_ALERTS',
  APPEND_ALERTS: 'APPEND_ALERTS',
  SET_CURRENT_ALERT: 'SET_CURRENT_ALERT',
  ADD_ALERT: 'ADD_ALERT',
  UPDATE_ALERT: 'UPDATE_ALERT',
  REMOVE_ALERT: 'REMOVE_ALERT',
  SET_FILTERS: 'SET_FILTERS',
  RESET_PAGINATION: 'RESET_PAGINATION',
  INCREMENT_PAGE: 'INCREMENT_PAGE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const alertReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_REFRESHING:
      return { ...state, refreshing: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false, refreshing: false };
    
    case ACTIONS.SET_ALERTS:
      return {
        ...state,
        alerts: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
        refreshing: false,
        error: null,
        pagination: {
          ...state.pagination,
          hasMore: Array.isArray(action.payload) ? action.payload.length === state.pagination.size : false,
        },
      };
    
    case ACTIONS.APPEND_ALERTS:
      return {
        ...state,
        alerts: [...(state.alerts || []), ...(Array.isArray(action.payload) ? action.payload : [])],
        loading: false,
        pagination: {
          ...state.pagination,
          hasMore: Array.isArray(action.payload) ? action.payload.length === state.pagination.size : false,
        },
      };
    
    case ACTIONS.SET_CURRENT_ALERT:
      return { ...state, currentAlert: action.payload };
    
    case ACTIONS.ADD_ALERT:
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        error: null,
      };
    
    case ACTIONS.UPDATE_ALERT:
      return {
        ...state,
        alerts: (state.alerts || []).map(alert =>
          alert.id === action.payload.id ? action.payload : alert
        ),
        currentAlert: state.currentAlert?.id === action.payload.id ? action.payload : state.currentAlert,
        error: null,
      };
    
    case ACTIONS.REMOVE_ALERT:
      return {
        ...state,
        alerts: (state.alerts || []).filter(alert => alert.id !== action.payload),
        currentAlert: state.currentAlert?.id === action.payload ? null : state.currentAlert,
        error: null,
      };
    
    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 0 },
      };
    
    case ACTIONS.RESET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, page: 0, hasMore: true },
      };
    
    case ACTIONS.INCREMENT_PAGE:
      return {
        ...state,
        pagination: { ...state.pagination, page: state.pagination.page + 1 },
      };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create context
const AlertContext = createContext();

// Custom hook to use the alert context
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Alert Provider component
export const AlertProvider = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  };

  const setRefreshing = (refreshing) => {
    dispatch({ type: ACTIONS.SET_REFRESHING, payload: refreshing });
  };

  const setError = (error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  const setFilters = (filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  };

  // Load alerts with current filters and pagination
  const loadAlerts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        dispatch({ type: ACTIONS.RESET_PAGINATION });
      } else {
        setLoading(true);
      }

      const page = refresh ? 0 : state.pagination.page;
      const options = {
        page,
        size: state.pagination.size,
        ...state.filters,
      };

      const alerts = await getAlerts(options);

      if (refresh || page === 0) {
        dispatch({ type: ACTIONS.SET_ALERTS, payload: alerts });
      } else {
        dispatch({ type: ACTIONS.APPEND_ALERTS, payload: alerts });
      }
    } catch (error) {
      setError(error.message || 'Error al cargar alertas');
    }
  };

  // Load more alerts (pagination)
  const loadMoreAlerts = async () => {
    if (!state.pagination.hasMore || state.loading) return;

    dispatch({ type: ACTIONS.INCREMENT_PAGE });
    await loadAlerts();
  };

  // Refresh alerts
  const refreshAlerts = async () => {
    await loadAlerts(true);
  };

  // Get alert by ID
  const loadAlertById = async (alertId) => {
    try {
      setLoading(true);
      const alert = await getAlertById(alertId);
      dispatch({ type: ACTIONS.SET_CURRENT_ALERT, payload: alert });
      return alert;
    } catch (error) {
      setError(error.message || 'Error al cargar alerta');
      throw error;
    }
  };

  // Create new alert
  const createNewAlert = async (alertData) => {
    try {
      setLoading(true);
      const newAlert = await createAlert(alertData);
      dispatch({ type: ACTIONS.ADD_ALERT, payload: newAlert });
      return newAlert;
    } catch (error) {
      setError(error.message || 'Error al crear alerta');
      throw error;
    }
  };

  // Update existing alert
  const updateExistingAlert = async (alertId, alertData) => {
    try {
      setLoading(true);
      const updatedAlert = await updateAlert(alertId, alertData);
      dispatch({ type: ACTIONS.UPDATE_ALERT, payload: updatedAlert });
      return updatedAlert;
    } catch (error) {
      setError(error.message || 'Error al actualizar alerta');
      throw error;
    }
  };

  // Delete alert
  const removeAlert = async (alertId) => {
    try {
      setLoading(true);
      await deleteAlert(alertId);
      dispatch({ type: ACTIONS.REMOVE_ALERT, payload: alertId });
    } catch (error) {
      setError(error.message || 'Error al eliminar alerta');
      throw error;
    }
  };

  // Filter alerts by type
  const filterByType = (type) => {
    setFilters({ type: type === state.filters.type ? null : type });
  };

  // Filter alerts by status
  const filterByStatus = (status) => {
    setFilters({ status });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ type: null, status: ALERT_STATUS.ACTIVE });
  };

  // Get filtered alerts count
  const getFilteredCount = () => {
    return (state.alerts || []).length;
  };

  // Get alerts by type
  const getAlertsByType = (type) => {
    return (state.alerts || []).filter(alert => alert.type === type);
  };

  // Load initial alerts when filters change
  useEffect(() => {
    loadAlerts();
  }, [state.filters]);

  const value = {
    // State
    alerts: state.alerts,
    currentAlert: state.currentAlert,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: state.pagination,
    refreshing: state.refreshing,

    // Actions
    loadAlerts,
    loadMoreAlerts,
    refreshAlerts,
    loadAlertById,
    createNewAlert,
    updateExistingAlert,
    removeAlert,
    setFilters,
    filterByType,
    filterByStatus,
    clearFilters,
    clearError,

    // Utilities
    getFilteredCount,
    getAlertsByType,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;
