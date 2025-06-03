import { VALIDATION_PATTERNS, ERROR_MESSAGES } from './constants';

/**
 * Validates if a field is not empty
 * @param {string} value - The value to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value) => {
  if (!value || value.trim() === '') {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }
  return null;
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email) => {
  const requiredError = validateRequired(email);
  if (requiredError) return requiredError;
  
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
  return null;
};

/**
 * Validates username format
 * @param {string} username - The username to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateUsername = (username) => {
  const requiredError = validateRequired(username);
  if (requiredError) return requiredError;
  
  if (!VALIDATION_PATTERNS.USERNAME.test(username)) {
    return ERROR_MESSAGES.INVALID_USERNAME;
  }
  return null;
};

/**
 * Validates password length
 * @param {string} password - The password to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (password) => {
  const requiredError = validateRequired(password);
  if (requiredError) return requiredError;
  
  if (password.length < 6) {
    return ERROR_MESSAGES.PASSWORD_MIN_LENGTH;
  }
  return null;
};

/**
 * Validates password confirmation
 * @param {string} password - The original password
 * @param {string} confirmPassword - The confirmation password
 * @returns {string|null} - Error message or null if valid
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  const requiredError = validateRequired(confirmPassword);
  if (requiredError) return requiredError;
  
  if (password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
  }
  return null;
};

/**
 * Validates phone number format (optional field)
 * @param {string} phone - The phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (phone) => {
  // Phone is optional, so if empty, it's valid
  if (!phone || phone.trim() === '') {
    return null;
  }
  
  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    return ERROR_MESSAGES.INVALID_PHONE;
  }
  return null;
};

/**
 * Validates registration form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Object with field errors
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  errors.username = validateUsername(formData.username);
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  errors.confirmPassword = validatePasswordConfirmation(formData.password, formData.confirmPassword);
  errors.phoneNumber = validatePhone(formData.phoneNumber);
  errors.subscriptionEmail = validateEmail(formData.subscriptionEmail);
  
  // Remove null errors
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) {
      delete errors[key];
    }
  });
  
  return errors;
};

/**
 * Validates login form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Object with field errors
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  
  errors.username = validateRequired(formData.username);
  errors.password = validateRequired(formData.password);
  
  // Remove null errors
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) {
      delete errors[key];
    }
  });
  
  return errors;
};

/**
 * Validates profile update form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Object with field errors
 */
export const validateProfileForm = (formData) => {
  const errors = {};
  
  errors.email = validateEmail(formData.email);
  errors.phoneNumber = validatePhone(formData.phoneNumber);
  errors.subscriptionEmail = validateEmail(formData.subscriptionEmail);
  
  // Remove null errors
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) {
      delete errors[key];
    }
  });
  
  return errors;
};

/**
 * Checks if form has any errors
 * @param {Object} errors - The errors object
 * @returns {boolean} - True if form has errors
 */
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
