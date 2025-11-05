// vueApp-main-new/src/utils/auth/awsCognitoHandler.js

import {
  createCognitoUser,
  createAuthenticationDetails,
  createCognitoAttributes,
  getCognitoUserSession,
  updateCognitoUserAttributes,
  signOutCognitoUser,
  getCurrentCognitoUser,
  getCognitoUserPool
} from './awsCognitoUtilities';
import { log } from '../common/logHandler';
/**
 * @file awsCognitoHandler.js
 * @description High-level AWS Cognito authentication operations
 * @purpose Provides login, signup, password reset, and profile management using AWS Cognito
 */

// Performance tracker available globally as window.performanceTracker

// Temporary storage for tokens to log after navigation
let pendingTokens = null;

/**
 * @function authenticateUser
 * @description Authenticate user with email and password via AWS Cognito
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Tokens object { idToken, accessToken, refreshToken }
 */
export async function authenticateUser(email, password) {
  log('awsCognitoHandler.js', 'authenticateUser', 'start', 'Begin user authentication', { email });
  window.performanceTracker.step({
    step: 'authenticateUser_start',
    file: 'awsCognitoHandler.js',
    method: 'authenticateUser',
    flag: 'start',
    purpose: 'Authenticate user with Cognito'
  });

  try {
    const cognitoUser = createCognitoUser(email);
    const authDetails = createAuthenticationDetails(email, password);

    log('awsCognitoHandler.js', 'authenticateUser', 'auth-attempt', 'Attempting Cognito authentication', { email });

    const tokens = await new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().getJwtToken();
          const accessToken = result.getAccessToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();

          log('awsCognitoHandler.js', 'authenticateUser', 'auth-success', 'Authentication successful', { 
            email, 
            idTokenLength: idToken.length,
            accessTokenLength: accessToken.length
          });

          // Store tokens for retrieval after navigation
          pendingTokens = { idToken, accessToken, refreshToken };

          // Update lastlogin timestamp
          const formattedDate = Math.floor(new Date().getTime() / 1000).toString();
          const attributes = createCognitoAttributes({ 'custom:lastlogin': formattedDate });

          updateCognitoUserAttributes(cognitoUser, attributes)
            .then(() => {
              log('awsCognitoHandler.js', 'authenticateUser', 'lastlogin-updated', 'Last login timestamp updated', { email });
              resolve({ idToken, accessToken, refreshToken });
            })
            .catch((updateError) => {
              log('awsCognitoHandler.js', 'authenticateUser', 'lastlogin-error', 'Failed to update lastlogin, continuing', { 
                email, 
                error: updateError.message 
              });
              // Continue with login despite lastlogin update failure
              resolve({ idToken, accessToken, refreshToken });
            });
        },
        onFailure: (error) => {
          log('awsCognitoHandler.js', 'authenticateUser', 'auth-failure', 'Authentication failed', { 
            email, 
            error: error.message 
          });
          reject(error);
        }
      });
    });

    log('awsCognitoHandler.js', 'authenticateUser', 'success', 'User authenticated successfully', { email });
    window.performanceTracker.step({
      step: 'authenticateUser_complete',
      file: 'awsCognitoHandler.js',
      method: 'authenticateUser',
      flag: 'success',
      purpose: 'Authentication complete'
    });

    return tokens;
  } catch (error) {
    log('awsCognitoHandler.js', 'authenticateUser', 'error', 'Authentication error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'authenticateUser_error',
      file: 'awsCognitoHandler.js',
      method: 'authenticateUser',
      flag: 'error',
      purpose: 'Authentication failed'
    });
    throw error;
  }
}

/**
 * @function registerNewUser
 * @description Register new user with AWS Cognito
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} attributes - Additional user attributes
 * @returns {Promise<object>} Registration result
 */
export async function registerNewUser(email, password, attributes = {}) {
  log('awsCognitoHandler.js', 'registerNewUser', 'start', 'Begin user registration', { email, attributeKeys: Object.keys(attributes) });
  window.performanceTracker.step({
    step: 'registerNewUser_start',
    file: 'awsCognitoHandler.js',
    method: 'registerNewUser',
    flag: 'start',
    purpose: 'Register new user in Cognito'
  });

  try {
    const userPool = getCognitoUserPool();
    const attributeList = createCognitoAttributes(attributes);

    log('awsCognitoHandler.js', 'registerNewUser', 'signup-attempt', 'Attempting Cognito signup', { email });

    const result = await new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, null, (error, result) => {
        if (error) {
          log('awsCognitoHandler.js', 'registerNewUser', 'signup-failure', 'Signup failed', { 
            email, 
            error: error.message 
          });
          return reject(error);
        }

        log('awsCognitoHandler.js', 'registerNewUser', 'signup-success', 'Signup successful', { 
          email, 
          userSub: result.userSub 
        });
        resolve(result);
      });
    });

    log('awsCognitoHandler.js', 'registerNewUser', 'success', 'User registered successfully', { email, userSub: result.userSub });
    window.performanceTracker.step({
      step: 'registerNewUser_complete',
      file: 'awsCognitoHandler.js',
      method: 'registerNewUser',
      flag: 'success',
      purpose: 'Registration complete'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'registerNewUser', 'error', 'Registration error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'registerNewUser_error',
      file: 'awsCognitoHandler.js',
      method: 'registerNewUser',
      flag: 'error',
      purpose: 'Registration failed'
    });
    throw error;
  }
}

/**
 * @function confirmUserSignup
 * @description Confirm user signup with verification code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @returns {Promise<string>} Confirmation result
 */
export async function confirmUserSignup(email, code) {
  log('awsCognitoHandler.js', 'confirmUserSignup', 'start', 'Begin signup confirmation', { email, hasCode: !!code });
  window.performanceTracker.step({
    step: 'confirmUserSignup_start',
    file: 'awsCognitoHandler.js',
    method: 'confirmUserSignup',
    flag: 'start',
    purpose: 'Confirm user signup with code'
  });

  try {
    const cognitoUser = createCognitoUser(email);

    log('awsCognitoHandler.js', 'confirmUserSignup', 'confirm-attempt', 'Attempting confirmation', { email });

    const result = await new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (error, result) => {
        if (error) {
          log('awsCognitoHandler.js', 'confirmUserSignup', 'confirm-failure', 'Confirmation failed', { 
            email, 
            error: error.message 
          });
          return reject(error);
        }

        log('awsCognitoHandler.js', 'confirmUserSignup', 'confirm-success', 'Confirmation successful', { email, result });
        resolve(result);
      });
    });

    log('awsCognitoHandler.js', 'confirmUserSignup', 'success', 'Signup confirmed successfully', { email });
    window.performanceTracker.step({
      step: 'confirmUserSignup_complete',
      file: 'awsCognitoHandler.js',
      method: 'confirmUserSignup',
      flag: 'success',
      purpose: 'Confirmation complete'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'confirmUserSignup', 'error', 'Confirmation error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'confirmUserSignup_error',
      file: 'awsCognitoHandler.js',
      method: 'confirmUserSignup',
      flag: 'error',
      purpose: 'Confirmation failed'
    });
    throw error;
  }
}

/**
 * @function changeUserPassword
 * @description Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<string>} Success message
 */
export async function changeUserPassword(currentPassword, newPassword) {
  log('awsCognitoHandler.js', 'changeUserPassword', 'start', 'Begin password change', { hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });
  window.performanceTracker.step({
    step: 'changeUserPassword_start',
    file: 'awsCognitoHandler.js',
    method: 'changeUserPassword',
    flag: 'start',
    purpose: 'Change user password'
  });

  try {
    const currentUser = getCurrentCognitoUser();

    if (!currentUser) {
      log('awsCognitoHandler.js', 'changeUserPassword', 'no-user', 'No authenticated user found', {});
      window.performanceTracker.step({
        step: 'changeUserPassword_no_user',
        file: 'awsCognitoHandler.js',
        method: 'changeUserPassword',
        flag: 'no-user',
        purpose: 'No user to change password for'
      });
      throw new Error('Not authenticated');
    }

    log('awsCognitoHandler.js', 'changeUserPassword', 'change-attempt', 'Attempting password change', { username: currentUser.getUsername() });

    const result = await new Promise((resolve, reject) => {
      currentUser.getSession((sessionError) => {
        if (sessionError) {
          log('awsCognitoHandler.js', 'changeUserPassword', 'session-error', 'Failed to get session', { error: sessionError.message });
          return reject(sessionError);
        }

        currentUser.changePassword(currentPassword, newPassword, (error, result) => {
          if (error) {
            log('awsCognitoHandler.js', 'changeUserPassword', 'change-failure', 'Password change failed', { error: error.message });
            return reject(error);
          }

          log('awsCognitoHandler.js', 'changeUserPassword', 'change-success', 'Password changed successfully', { result });
          resolve(result);
        });
      });
    });

    log('awsCognitoHandler.js', 'changeUserPassword', 'success', 'Password change complete', {});
    window.performanceTracker.step({
      step: 'changeUserPassword_complete',
      file: 'awsCognitoHandler.js',
      method: 'changeUserPassword',
      flag: 'success',
      purpose: 'Password change complete'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'changeUserPassword', 'error', 'Password change error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'changeUserPassword_error',
      file: 'awsCognitoHandler.js',
      method: 'changeUserPassword',
      flag: 'error',
      purpose: 'Password change failed'
    });
    throw error;
  }
}

/**
 * @function initiatePasswordReset
 * @description Initiate forgot password flow
 * @param {string} email - User email
 * @returns {Promise<object>} Reset initiation result
 */
export async function initiatePasswordReset(email) {
  log('awsCognitoHandler.js', 'initiatePasswordReset', 'start', 'Begin password reset', { email });
  window.performanceTracker.step({
    step: 'initiatePasswordReset_start',
    file: 'awsCognitoHandler.js',
    method: 'initiatePasswordReset',
    flag: 'start',
    purpose: 'Initiate forgot password flow'
  });

  try {
    const cognitoUser = createCognitoUser(email);

    log('awsCognitoHandler.js', 'initiatePasswordReset', 'reset-attempt', 'Sending password reset request', { email });

    const result = await new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          log('awsCognitoHandler.js', 'initiatePasswordReset', 'reset-success', 'Password reset initiated', { email, data });
          resolve(data);
        },
        onFailure: (error) => {
          log('awsCognitoHandler.js', 'initiatePasswordReset', 'reset-failure', 'Password reset failed', { 
            email, 
            error: error.message 
          });
          reject(error);
        }
      });
    });

    log('awsCognitoHandler.js', 'initiatePasswordReset', 'success', 'Password reset email sent', { email });
    window.performanceTracker.step({
      step: 'initiatePasswordReset_complete',
      file: 'awsCognitoHandler.js',
      method: 'initiatePasswordReset',
      flag: 'success',
      purpose: 'Password reset initiated'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'initiatePasswordReset', 'error', 'Password reset error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'initiatePasswordReset_error',
      file: 'awsCognitoHandler.js',
      method: 'initiatePasswordReset',
      flag: 'error',
      purpose: 'Password reset failed'
    });
    throw error;
  }
}

/**
 * @function confirmPasswordReset
 * @description Confirm password reset with code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @param {string} newPassword - New password
 * @returns {Promise<string>} Confirmation result
 */
export async function confirmPasswordReset(email, code, newPassword) {
  log('awsCognitoHandler.js', 'confirmPasswordReset', 'start', 'Begin password reset confirmation', { email, hasCode: !!code, hasNewPassword: !!newPassword });
  window.performanceTracker.step({
    step: 'confirmPasswordReset_start',
    file: 'awsCognitoHandler.js',
    method: 'confirmPasswordReset',
    flag: 'start',
    purpose: 'Confirm password reset with code'
  });

  try {
    const cognitoUser = createCognitoUser(email);

    log('awsCognitoHandler.js', 'confirmPasswordReset', 'confirm-attempt', 'Confirming password reset', { email });

    const result = await new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: (data) => {
          log('awsCognitoHandler.js', 'confirmPasswordReset', 'confirm-success', 'Password reset confirmed', { email, data });
          resolve(data);
        },
        onFailure: (error) => {
          log('awsCognitoHandler.js', 'confirmPasswordReset', 'confirm-failure', 'Password reset confirmation failed', { 
            email, 
            error: error.message 
          });
          reject(error);
        }
      });
    });

    log('awsCognitoHandler.js', 'confirmPasswordReset', 'success', 'Password reset complete', { email });
    window.performanceTracker.step({
      step: 'confirmPasswordReset_complete',
      file: 'awsCognitoHandler.js',
      method: 'confirmPasswordReset',
      flag: 'success',
      purpose: 'Password reset confirmed'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'confirmPasswordReset', 'error', 'Password reset confirmation error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'confirmPasswordReset_error',
      file: 'awsCognitoHandler.js',
      method: 'confirmPasswordReset',
      flag: 'error',
      purpose: 'Password reset confirmation failed'
    });
    throw error;
  }
}

/**
 * @function updateUserProfile
 * @description Update user profile attributes
 * @param {object} attributes - Attributes to update
 * @returns {Promise<string>} Update result
 */
export async function updateUserProfile(attributes) {
  log('awsCognitoHandler.js', 'updateUserProfile', 'start', 'Begin profile update', { attributeKeys: Object.keys(attributes) });
  window.performanceTracker.step({
    step: 'updateUserProfile_start',
    file: 'awsCognitoHandler.js',
    method: 'updateUserProfile',
    flag: 'start',
    purpose: 'Update user profile attributes'
  });

  try {
    const currentUser = getCurrentCognitoUser();

    if (!currentUser) {
      log('awsCognitoHandler.js', 'updateUserProfile', 'no-user', 'No authenticated user found', {});
      window.performanceTracker.step({
        step: 'updateUserProfile_no_user',
        file: 'awsCognitoHandler.js',
        method: 'updateUserProfile',
        flag: 'no-user',
        purpose: 'No user to update profile for'
      });
      throw new Error('Not authenticated');
    }

    log('awsCognitoHandler.js', 'updateUserProfile', 'update-attempt', 'Updating profile attributes', { 
      username: currentUser.getUsername(), 
      attributeKeys: Object.keys(attributes) 
    });

    const result = await new Promise((resolve, reject) => {
      currentUser.getSession((sessionError, session) => {
        if (sessionError || !session.isValid()) {
          log('awsCognitoHandler.js', 'updateUserProfile', 'session-error', 'Invalid session', { error: sessionError?.message });
          return reject(sessionError || new Error('Invalid session'));
        }

        const attributeList = createCognitoAttributes(attributes);
        updateCognitoUserAttributes(currentUser, attributeList)
          .then((result) => {
            log('awsCognitoHandler.js', 'updateUserProfile', 'update-success', 'Profile updated successfully', { result });
            resolve(result);
          })
          .catch((error) => {
            log('awsCognitoHandler.js', 'updateUserProfile', 'update-failure', 'Profile update failed', { error: error.message });
            reject(error);
          });
      });
    });

    log('awsCognitoHandler.js', 'updateUserProfile', 'success', 'Profile update complete', {});
    window.performanceTracker.step({
      step: 'updateUserProfile_complete',
      file: 'awsCognitoHandler.js',
      method: 'updateUserProfile',
      flag: 'success',
      purpose: 'Profile update complete'
    });

    return result;
  } catch (error) {
    log('awsCognitoHandler.js', 'updateUserProfile', 'error', 'Profile update error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'updateUserProfile_error',
      file: 'awsCognitoHandler.js',
      method: 'updateUserProfile',
      flag: 'error',
      purpose: 'Profile update failed'
    });
    throw error;
  }
}

/**
 * @function restoreUserSession
 * @description Restore user session from stored tokens
 * @returns {Promise<object>} Session tokens
 */
export async function restoreUserSession() {
  log('awsCognitoHandler.js', 'restoreUserSession', 'start', 'Begin session restoration', {});
  window.performanceTracker.step({
    step: 'restoreUserSession_start',
    file: 'awsCognitoHandler.js',
    method: 'restoreUserSession',
    flag: 'start',
    purpose: 'Restore user session from tokens'
  });

  try {
    const currentUser = getCurrentCognitoUser();

    if (!currentUser) {
      log('awsCognitoHandler.js', 'restoreUserSession', 'no-user', 'No current user found', {});
      window.performanceTracker.step({
        step: 'restoreUserSession_no_user',
        file: 'awsCognitoHandler.js',
        method: 'restoreUserSession',
        flag: 'no-user',
        purpose: 'No user to restore session for'
      });
      throw new Error('No user');
    }

    log('awsCognitoHandler.js', 'restoreUserSession', 'restore-attempt', 'Restoring session', { username: currentUser.getUsername() });

    const tokens = await getCognitoUserSession(currentUser);
    pendingTokens = tokens;

    log('awsCognitoHandler.js', 'restoreUserSession', 'success', 'Session restored successfully', { 
      username: currentUser.getUsername(),
      idTokenTruncated: tokens.idToken.substring(0, 20) + '...',
      accessTokenTruncated: tokens.accessToken.substring(0, 20) + '...'
    });
    window.performanceTracker.step({
      step: 'restoreUserSession_complete',
      file: 'awsCognitoHandler.js',
      method: 'restoreUserSession',
      flag: 'success',
      purpose: 'Session restoration complete'
    });

    return tokens;
  } catch (error) {
    log('awsCognitoHandler.js', 'restoreUserSession', 'error', 'Session restoration error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'restoreUserSession_error',
      file: 'awsCognitoHandler.js',
      method: 'restoreUserSession',
      flag: 'error',
      purpose: 'Session restoration failed'
    });
    throw error;
  }
}

/**
 * @function logoutUser
 * @description Log out current user
 * @returns {boolean} Success status
 */
export function logoutUser() {
  log('awsCognitoHandler.js', 'logoutUser', 'start', 'Begin user logout', {});
  window.performanceTracker.step({
    step: 'logoutUser_start',
    file: 'awsCognitoHandler.js',
    method: 'logoutUser',
    flag: 'start',
    purpose: 'Log out current user'
  });

  try {
    const success = signOutCognitoUser();
    localStorage.clear();
    pendingTokens = null;

    log('awsCognitoHandler.js', 'logoutUser', 'success', 'User logged out successfully', { success });
    window.performanceTracker.step({
      step: 'logoutUser_complete',
      file: 'awsCognitoHandler.js',
      method: 'logoutUser',
      flag: 'success',
      purpose: 'Logout complete'
    });

    return success;
  } catch (error) {
    log('awsCognitoHandler.js', 'logoutUser', 'error', 'Logout error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'logoutUser_error',
      file: 'awsCognitoHandler.js',
      method: 'logoutUser',
      flag: 'error',
      purpose: 'Logout failed'
    });
    return false;
  }
}

/**
 * @function getPendingTokens
 * @description Get and clear pending tokens stored after login
 * @returns {object|null} Pending tokens or null
 */
export function getPendingTokens() {
  log('awsCognitoHandler.js', 'getPendingTokens', 'start', 'Getting pending tokens', { hasPendingTokens: !!pendingTokens });
  window.performanceTracker.step({
    step: 'getPendingTokens_start',
    file: 'awsCognitoHandler.js',
    method: 'getPendingTokens',
    flag: 'start',
    purpose: 'Retrieve pending tokens'
  });

  const tokens = pendingTokens;
  pendingTokens = null;

  log('awsCognitoHandler.js', 'getPendingTokens', 'success', 'Pending tokens retrieved and cleared', { hadTokens: !!tokens });
  window.performanceTracker.step({
    step: 'getPendingTokens_complete',
    file: 'awsCognitoHandler.js',
    method: 'getPendingTokens',
    flag: 'success',
    purpose: 'Pending tokens returned'
  });

  return tokens;
}

// Export handler object with all methods
export const awsCognitoHandler = {
  login: authenticateUser,
  register: registerNewUser,
  confirmSignUp: confirmUserSignup,
  changePassword: changeUserPassword,
  forgotPassword: initiatePasswordReset,
  confirmPassword: confirmPasswordReset,
  updateProfileAttributes: updateUserProfile,
  restoreSession: restoreUserSession,
  logout: logoutUser,
  getPendingTokens
};

