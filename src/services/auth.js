import { createUser, validateCredentials } from './users';
import { saveCredentials, saveUserData, clearCredentials, getCredentials, getUserData, saveUserDataForUser, getUserDataForUser } from '../utils/storage';
import apiClient from './api';

/**
 * Registers a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Created user data
 */
export const register = async (userData) => {
  try {
    const newUser = await createUser(userData);
    console.log('✅ User registered successfully:', { username: userData.username, email: userData.email });
    
    // Save the complete user data for future profile use
    const completeUserData = {
      id: newUser.id || 1,
      username: userData.username,
      email: userData.email,
      phoneNumber: userData.phoneNumber || '',
      subscriptionEmail: userData.subscriptionEmail || userData.email,
      role: userData.role || 'USER',
      createdAt: newUser.createdAt || new Date().toISOString(),
    };
    
    // Save user data locally for profile management
    await saveUserDataForUser(userData.username, completeUserData);
    
    return newUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Logs in a user
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<Object>} - User data
 */
export const login = async (username, password) => {
  try {
    console.log(`🔐 Attempting login for user: ${username}`);
    
    // Validate credentials with the API
    const validationResult = await validateCredentials(username, password);
    
    // Check if we have existing user data for this specific user
    let existingUserData = await getUserDataForUser(username);
    
    console.log(`📱 Existing data for user ${username}:`, existingUserData);
    
    // Create complete user data - prefer existing data if available for this user
    const userData = {
      id: existingUserData?.id || 1,
      username: username,
      email: existingUserData?.email || '', // Start empty for new users
      phoneNumber: existingUserData?.phoneNumber || '',
      subscriptionEmail: existingUserData?.subscriptionEmail || '', // Start empty for new users
      role: existingUserData?.role || 'USER',
      createdAt: existingUserData?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    // Save credentials and user data
    await saveCredentials(username, password);
    await saveUserDataForUser(username, userData);
    
    console.log(`✅ Login successful for user: ${username}`, userData);
    return userData;
  } catch (error) {
    console.log(`❌ Login failed for user: ${username}`, error.message);
    throw error;
  }
};

/**
 * Logs out the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Only clear credentials, keep user data for next login
    // This allows users to see their profile data when they log back in
    await clearCredentials();
    console.log('✅ User logged out, credentials cleared');
  } catch (error) {
    console.error('Error during logout:', error);
    // Don't throw error for logout
  }
};

/**
 * Gets the current authenticated user
 * @returns {Promise<Object|null>} - Current user data or null
 */
export const getCurrentUser = async () => {
  try {
    const userData = await getUserData();
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Checks if user is authenticated
 * @returns {Promise<boolean>} - True if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const credentials = await getCredentials();
    return credentials !== null;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Validates current session by making an API call
 * @returns {Promise<boolean>} - True if session is valid
 */
export const validateSession = async () => {
  try {
    const credentials = await getCredentials();
    if (!credentials) {
      return false;
    }
    
    // Try to validate credentials with API
    await validateCredentials(credentials.username, credentials.password);
    return true;
  } catch (error) {
    // If validation fails, clear stored data
    await clearAllData();
    return false;
  }
};

/**
 * Requests a password reset email
 * @param {string} email - The email address
 * @returns {Promise<Object>} - Response message
 */
export const requestPasswordReset = async (email) => {
  try {
    console.log(`🔐 Requesting password reset for: ${email}`);
    
    const response = await apiClient.post('/auth/forgot-password', 
      { email }, 
      { skipAuth: true }
    );

    console.log('✅ Password reset email sent');
    return response.data;
  } catch (error) {
    console.error('❌ Password reset request failed:', error);
    throw error;
  }
};

/**
 * Verifies if a reset token is valid
 * @param {string} token - The reset token
 * @returns {Promise<Object>} - Token validation result
 */
export const verifyResetToken = async (token) => {
  try {
    console.log(`🔍 Verifying reset token: ${token.substring(0, 8)}...`);
    
    const response = await apiClient.get(`/auth/verify-reset-token/${token}`, {
      skipAuth: true
    });

    console.log('✅ Token verified successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    throw error;
  }
};

/**
 * Resets password with token
 * @param {string} token - The reset token
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} - Reset result
 */
export const resetPassword = async (token, newPassword) => {
  try {
    console.log(`🔐 Resetting password with token: ${token.substring(0, 8)}...`);
    
    const response = await apiClient.post('/auth/reset-password', 
      { token, newPassword },
      { skipAuth: true }
    );

    console.log('✅ Password reset successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    throw error;
  }
};
