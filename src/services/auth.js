import { createUser, validateCredentials } from './users';
import { saveCredentials, saveUserData, clearAllData, getCredentials, getUserData } from '../utils/storage';

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
    await saveUserData(completeUserData);
    
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
    
    // Check if we have existing user data for this user
    let existingUserData = await getUserData();
    
    // Create complete user data - prefer existing data if available
    const userData = {
      id: existingUserData?.id || 1,
      username: username,
      email: existingUserData?.email || username + '@example.com',
      phoneNumber: existingUserData?.phoneNumber || '',
      subscriptionEmail: existingUserData?.subscriptionEmail || existingUserData?.email || username + '@example.com',
      role: existingUserData?.role || 'USER',
      createdAt: existingUserData?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    // Save credentials and user data
    await saveCredentials(username, password);
    await saveUserData(userData);
    
    console.log(`✅ Login successful for user: ${username}`);
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
    await clearAllData();
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
