// vueApp-main-new/src/utils/auth/authHandlerDev.js

import { log } from '../common/logHandler';
/**
 * @file authHandlerDev.js
 * @description Development authentication handler that bypasses AWS Cognito
 * @purpose Provides mock authentication for local development
 */

// Performance tracker available globally as window.performanceTracker

let pendingTokens = null;

// Mock credentials for development
const mockCredentials = {
  idToken: "eyJraWQiOiJLOHY5XC9jdFFoem9Vb0pkMHB4RmVDWll4SjBRdyt1YVFmNVM4Q0I5RnJTbz0iLCJhbGciOiJSUzI1NiJ9.eyJjdXN0b206a3ljIjoidHJ1ZSIsInN1YiI6Ijk3YzQ1YWM4LTcwZTEtNzA5My0yYTEzLWM0OTI0NThiNDg2YyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfSWtXME9DV05vIiwiY29nbml0bzp1c2VybmFtZSI6IjE4NTIwNTE1QGdtLnVpdC5lZHUudm4iLCJvcmlnaW5fanRpIjoiMzIzNGE5ODUtM2I4YS00ZDAxLThiMzQtNjQ3MWM4ZjcxZjllIiwiYXVkIjoiNmRub2JnaTNlazBxYmJjcDg5cWtoYm9iNm8iLCJldmVudF9pZCI6Ijc1ZDZkYWU4LWNjNGQtNGVhOC1hMWJkLWM2YjBiOThmNTU1NSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzU2MzkyMTYzLCJuYW1lIjoiMTg1MjA1MTUiLCJjdXN0b206bGFzdGxvZ2luIjoiMTc1NjM5MTkyOCIsImV4cCI6MTc1NjM5NTc2MywiY3VzdG9tOnJvbGUiOiJjcmVhdG9yIiwiaWF0IjoxNzU2MzkyMTYzLCJqdGkiOiJiMzFjYzc1Yi1hM2UxLTQ1NjAtYjA2NS1iOTliZmFmZGQwYzUiLCJlbWFpbCI6IjE4NTIwNTE1QGdtLnVpdC5lZHUudm4ifQ.eGRxlaGKfJvaIPJtGxZZnoFQwSb5QZb8x75GnXQoi1TbRlbKDobt8FCcVcBE7OkwDR6suRmW1UQP9S3ZqL-b1DpXMSmYe9Hpv5GrPWnpoUiBdJypDoqNyM55cwxgdmQfIUKJDjh9S0f8s2Bf2Zqt12Do9LFlZlqB6Absf7t0MZyUF9RFBiJyf6QuLuuisrFj75Lm4XdydZO2hmB-Aw86Pzj90gq4ZojldDDuEXm1nIEGO8K79yFWczgChZvxeLOOg5yPd7BRPKcPHkoJiqsqXmpQD_u-PjBirDRdzLIRIK0OuVRhCRkUph509y775pDCerWeGADk-tM9UYzH_WR0JA",
  refreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.SGslq2_s0csRWCkYMHEkBnwLEIH5EULR6IdFChxXPTO181SUan7R--aVG5GXjNDY5-jCAL53jMz8OHxfSA4ftWO9x1p16erj-cZ9B6Xsy6EsV1Om2wvVUt9W0FtKq1hm9KQ98hW58m5J-guSiuttgZL10QOOdkcbyRslz8AxUsF5i07OGyD7QAsV6By91k6mLeYRW10iBhWIW61abr7K_MjmQBON3V5FDlxgfgaqADJxt6eZs_UbHIDRus-f0oFrJf8iLSVXrsFKs5_zrM-78ARKjP8aGdLUCgaH4r8FRPASGTa8DwaPsVbuo28i68oIU8-AWk8tyc_qjtNvb1iU1A.y8mwI5DsCL7iW7tR.8T7qQIBE4ugEvu03lHohA9iTSshPRrT_SxUkW_Qee9QiJdFeFFlwIBiJFZoodUlDil8A5-xWw30xojr0izxH4E-tatko2ImNU0_8faWKf2P40upfeFZmbabN4df_gtel4gb2dtWIvl3QvS5qqKplKyzMIACBEI7N_VfrCW8Qn7KhD_CRneICoVLZYN60Rtya8-rEdDrrl4UJ3bKSVdHioIMml2DDT39eBfiv3hRFQGx9LvvmLFTMvb5MpG1bKaivkw9ImFWks_dk1GF2m2MikmzPS9iadGDUvZrpqDrveVinJjK2LmQLIVizS94EkF1zqhb_epd3zdsWHwq8zz21suy1qgwC_v8SUufylseG2WLAS8iRpVOzhBQ-wBYEJTxeaZ0cxAZGnaIKU1EOr1l6WQu0LYnI0VpHaDDXPR83g_05ypK6MXZyLLFdgJ-D_kuCVSqYS6lnk7qn6a2Ns3PByx_pJ4JXuNCsw5VAKA_2Qciw1sHjUiMHvfHWtRbw6FzfN97LSDPxneAZNhWUtcS30KxKIJimWXwo1vc2CW4YKOvbQbsFhdZZS26Jls3TV7jm0aszYxNyPKlnVTije39-N_yCMzBK49O-V59mCphzywAZq9hc0ZzoQetjikEHS3p_6lrei59bClEPXZbfKyt81SWox85-Mw7NQbkboqJqVsS4_HI3HIvhfr025QC2QKb1vDndan_t0MmV336zlPSnXRyRrjWK-M0r1iSjpr3soh0y6Am7uWBgQQ9BUkfDWPBkYOxH6-Dyww0YvgukTZk-OX0q4lNC0Wf0furX0fegYe9ljeTzdY_J-gtObS0UeGn7bC3ujz_Jrf9kTxvULLpTRcPJ7i8b3WgSenBKH9jzGxeXMzc1cLbJJi98cSi2yX0SO51UxhJS3qcgLzv0PQ028R1dbRhbuMVOwhso0Bxq4A3h_sNwU-PdCR8Jpf_sr0YixwycXT89A0tKKeoCP4nsrJikVVlGNqoUfo2QOyQ34imGmlbJKBFrCDRkQDfX81YIC92Rv-pYccrbWrP83HYluk3gst5AagcaWGjubwonewwXIf_qmcNhmoqPWqpi3hrnHh4WXsgAKGIiUCXys7ogcd6_0zUjssZwkAPGcQYT0-jM-dmw64Nk8QkORHp4J3LJvmCu4dmhtO5mTIgMXn0WiarJFj4-_-O1mj6-Biqt6nOBVlYWW_bmAkjctKXNqdSSkDt_AZSWJAKVbr_m-fHrA5ATRUfUUuGp0-kV4HKbeDwmvaaV_9B3hWD9gqz65BgoCPqSpk6XLZ9LptjjBHlxXC202-ODvsS9OxVz833x0c2umiFEiV7M.hlZnmGULZwW-12Pqd0y3tQ",
  accessToken: "eyJraWQiOiJTZnlFXC9PNnErWEFkOUFTNkJ5eFQzUVp1TUxHYXlCQlVjeCtXOEoyQVZoOD0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5N2M0NWFjOC03MGUxLTcwOTMtMmExMy1jNDkyNDU4YjQ4NmMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfSWtXME9DV05vIiwiY2xpZW50X2lkIjoiNmRub2JnaTNlazBxYmJjcDg5cWtoYm9iNm8iLCJvcmlnaW5fanRpIjoiMzIzNGE5ODUtM2I4YS00ZDAxLThiMzQtNjQ3MWM4ZjcxZjllIiwiZXZlbnRfaWQiOiI3NWQ2ZGFlOC1jYzRkLTRlYTgtYTFiZC1jNmIwYjk4ZjU1NTUiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzU2MzkyMTYzLCJleHAiOjE3NTYzOTU3NjMsImlhdCI6MTc1NjM5MjE2MywianRpIjoiOTkxODEyNzktNjAwMi00YjY2LTk0ZjItM2FlZmI5ZjM3ZTExIiwidXNlcm5hbWUiOiIxODUyMDUxNUBnbS51aXQuZWR1LnZuIn0.x6pi4gxYSnhgeTHVqEigolnzvg_NxhvbqW6gEvVqXSmtmVhCs1781-qz29ZBntgxCPXAGp7HAKg2u73D0_WsmZXjEgYEyy_7jwxhLqWzIIZFcSVVZAQjYgYZucPY6I_naE63m4ViIOIBDiEy4bm2uXVBSGaXqSFNW0hYoYw2E3sLxaqQGd0D2guNzB-eAigmJpMJPOscIPRJNEBJvWs_L4tPBl5gW_VztmhW1vMvz4qMpQL8oSuO7Ga2NAIxfR4mxKqoh8rCPlck-07FicY1KWSAD0jM5l670hqi4q7SUk2svELAvxKW5HFhmQJzFSashZtvKEv-Amuf36DDtzM0RA"
};

// Mock user data
const mockUser = {
  email: "dev@test.com",
  role: "creator",
  kycPassed: true,
  onboardingPassed: false,
  raw: {
    'custom:kyc': "true",
    sub: "97c45ac8-70e1-7093-2a13-c492458b486c",
    email_verified: true,
    iss: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_IkW0OCWNo",
    'cognito:username': "dev@test.com",
    origin_jti: "3234a985-3b8a-4d01-8b34-6471c8f71f9e",
    aud: "6dnobgi3ek0qbbcp89qkhbob6o",
    event_id: "75d6dae8-cc4d-4ea8-a1bd-c6b0b98f5555",
    token_use: "id",
    auth_time: Math.floor(Date.now() / 1000),
    name: "dev-user",
    'custom:lastlogin': Math.floor(Date.now() / 1000).toString(),
    exp: Math.floor(Date.now() / 1000) + 3600,
    'custom:role': "creator",
    iat: Math.floor(Date.now() / 1000),
    jti: "b31cc75b-a3e1-4560-b065-b99bfafdd0c5",
    email: "dev@test.com"
  }
};

/**
 * @function signJwtHS256
 * @description Create a mock JWT token for development
 * @param {object} payload - Token payload
 * @param {object} options - Token options
 * @returns {string} Fake JWT token
 */
function signJwtHS256(payload, options = {}) {
  log('authHandlerDev.js', 'signJwtHS256', 'start', 'Creating mock JWT token', { hasPayload: !!payload });
  window.performanceTracker.step({
    step: 'signJwtHS256_start',
    file: 'authHandlerDev.js',
    method: 'signJwtHS256',
    flag: 'start',
    purpose: 'Generate fake JWT for development'
  });

  const header = {
    alg: options.alg || 'HS256',
    typ: 'JWT'
  };

  const base64UrlEncode = (obj) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = 'fake-signature-for-dev-only';

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  log('authHandlerDev.js', 'signJwtHS256', 'success', 'Mock JWT created', { tokenLength: token.length });
  window.performanceTracker.step({
    step: 'signJwtHS256_complete',
    file: 'authHandlerDev.js',
    method: 'signJwtHS256',
    flag: 'success',
    purpose: 'Mock JWT generation complete'
  });

  return token;
}

/**
 * @function authenticateDevUser
 * @description Mock login for development
 * @param {object} credentials - Login credentials { email, password }
 * @returns {Promise<object>} Mock tokens
 */
async function authenticateDevUser({ email, password }) {
  log('authHandlerDev.js', 'authenticateDevUser', 'start', 'Begin dev authentication', { email });
  window.performanceTracker.step({
    step: 'authenticateDevUser_start',
    file: 'authHandlerDev.js',
    method: 'authenticateDevUser',
    flag: 'start',
    purpose: 'Mock authentication for development'
  });

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const { idToken: tempIdToken, accessToken, refreshToken } = mockCredentials;

    log('authHandlerDev.js', 'authenticateDevUser', 'auth-success', 'Dev authentication successful', { email });

    // Generate custom JWT with dev user data
    const idToken = signJwtHS256({
      sub: mockUser.raw.sub,
      email: mockUser.email,
      'cognito:username': mockUser.email,
      'custom:role': mockUser.role,
      'custom:kyc': mockUser.kycPassed.toString(),
      'custom:onboardingPassed': mockUser.onboardingPassed.toString(),
      aud: mockUser.raw.aud,
      iss: mockUser.raw.iss,
      token_use: 'id',
      name: mockUser.raw.name,
      email_verified: mockUser.raw.email_verified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      jti: mockUser.raw.jti,
      auth_time: mockUser.raw.auth_time,
      event_id: mockUser.raw.event_id,
      origin_jti: mockUser.raw.origin_jti
    }, { alg: 'HS256' });

    pendingTokens = { idToken, accessToken, refreshToken };

    // Store token in localStorage for persistence
    localStorage.setItem('idToken', idToken);

    log('authHandlerDev.js', 'authenticateDevUser', 'success', 'Dev login complete', { email, tokenLength: idToken.length });
    window.performanceTracker.step({
      step: 'authenticateDevUser_complete',
      file: 'authHandlerDev.js',
      method: 'authenticateDevUser',
      flag: 'success',
      purpose: 'Dev authentication complete'
    });

    return { idToken, accessToken, refreshToken };
  } catch (error) {
    log('authHandlerDev.js', 'authenticateDevUser', 'error', 'Dev authentication error', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'authenticateDevUser_error',
      file: 'authHandlerDev.js',
      method: 'authenticateDevUser',
      flag: 'error',
      purpose: 'Dev authentication failed'
    });
    throw error;
  }
}

/**
 * @function registerDevUser
 * @description Mock signup for development
 * @param {object} data - Signup data
 * @returns {Promise<object>} Mock result
 */
async function registerDevUser(data) {
  log('authHandlerDev.js', 'registerDevUser', 'start', 'Begin dev registration', { email: data.email });
  window.performanceTracker.step({
    step: 'registerDevUser_start',
    file: 'authHandlerDev.js',
    method: 'registerDevUser',
    flag: 'start',
    purpose: 'Mock registration for development'
  });

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    log('authHandlerDev.js', 'registerDevUser', 'success', 'Dev registration successful', { email: data.email });
    window.performanceTracker.step({
      step: 'registerDevUser_complete',
      file: 'authHandlerDev.js',
      method: 'registerDevUser',
      flag: 'success',
      purpose: 'Dev registration complete'
    });

    return { success: true, userSub: 'mock-user-sub' };
  } catch (error) {
    log('authHandlerDev.js', 'registerDevUser', 'error', 'Dev registration error', { 
      email: data.email, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'registerDevUser_error',
      file: 'authHandlerDev.js',
      method: 'registerDevUser',
      flag: 'error',
      purpose: 'Dev registration failed'
    });
    throw error;
  }
}

/**
 * @function handleDevCallback
 * @description Mock OAuth callback for development
 * @returns {Promise<object>} Mock tokens
 */
async function handleDevCallback() {
  log('authHandlerDev.js', 'handleDevCallback', 'start', 'Handling dev OAuth callback', {});
  window.performanceTracker.step({
    step: 'handleDevCallback_start',
    file: 'authHandlerDev.js',
    method: 'handleDevCallback',
    flag: 'start',
    purpose: 'Mock OAuth callback'
  });

  try {
    if (pendingTokens) {
      log('authHandlerDev.js', 'handleDevCallback', 'tokens-found', 'Pending tokens found', { hasPendingTokens: true });
      window.performanceTracker.step({
        step: 'handleDevCallback_complete',
        file: 'authHandlerDev.js',
        method: 'handleDevCallback',
        flag: 'success',
        purpose: 'OAuth callback complete with tokens'
      });
      return pendingTokens;
    }

    log('authHandlerDev.js', 'handleDevCallback', 'no-tokens', 'No pending tokens, simulating callback', {});
    window.performanceTracker.step({
      step: 'handleDevCallback_simulated',
      file: 'authHandlerDev.js',
      method: 'handleDevCallback',
      flag: 'success',
      purpose: 'OAuth callback simulated'
    });

    return true;
  } catch (error) {
    log('authHandlerDev.js', 'handleDevCallback', 'error', 'Dev callback error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'handleDevCallback_error',
      file: 'authHandlerDev.js',
      method: 'handleDevCallback',
      flag: 'error',
      purpose: 'OAuth callback failed'
    });
    throw error;
  }
}

/**
 * @function restoreDevSession
 * @description Restore session from localStorage for development
 * @returns {Promise<object|boolean>} Session data or false
 */
async function restoreDevSession() {
  log('authHandlerDev.js', 'restoreDevSession', 'start', 'Restoring dev session', {});
  window.performanceTracker.step({
    step: 'restoreDevSession_start',
    file: 'authHandlerDev.js',
    method: 'restoreDevSession',
    flag: 'start',
    purpose: 'Restore dev session from storage'
  });

  try {
    const storedToken = localStorage.getItem('idToken');

    if (storedToken) {
      log('authHandlerDev.js', 'restoreDevSession', 'token-found', 'Token found in localStorage', { tokenLength: storedToken.length });
      window.performanceTracker.step({
        step: 'restoreDevSession_complete',
        file: 'authHandlerDev.js',
        method: 'restoreDevSession',
        flag: 'success',
        purpose: 'Session restored from localStorage'
      });
      return { idToken: storedToken };
    }

    if (pendingTokens) {
      log('authHandlerDev.js', 'restoreDevSession', 'pending-tokens', 'Using pending tokens for restoration', {});
      localStorage.setItem('idToken', pendingTokens.idToken);
      window.performanceTracker.step({
        step: 'restoreDevSession_pending',
        file: 'authHandlerDev.js',
        method: 'restoreDevSession',
        flag: 'success',
        purpose: 'Session restored from pending tokens'
      });
      return { idToken: pendingTokens.idToken };
    }

    log('authHandlerDev.js', 'restoreDevSession', 'no-session', 'No session to restore', {});
    window.performanceTracker.step({
      step: 'restoreDevSession_no_session',
      file: 'authHandlerDev.js',
      method: 'restoreDevSession',
      flag: 'no-session',
      purpose: 'No session available'
    });

    return false;
  } catch (error) {
    log('authHandlerDev.js', 'restoreDevSession', 'error', 'Session restoration error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'restoreDevSession_error',
      file: 'authHandlerDev.js',
      method: 'restoreDevSession',
      flag: 'error',
      purpose: 'Session restoration failed'
    });
    return false;
  }
}

/**
 * @function logoutDevUser
 * @description Logout for development
 * @returns {Promise<boolean>} Success status
 */
async function logoutDevUser() {
  log('authHandlerDev.js', 'logoutDevUser', 'start', 'Dev logout', {});
  window.performanceTracker.step({
    step: 'logoutDevUser_start',
    file: 'authHandlerDev.js',
    method: 'logoutDevUser',
    flag: 'start',
    purpose: 'Dev user logout'
  });

  try {
    localStorage.clear();
    pendingTokens = null;

    log('authHandlerDev.js', 'logoutDevUser', 'success', 'Dev logout successful', {});
    window.performanceTracker.step({
      step: 'logoutDevUser_complete',
      file: 'authHandlerDev.js',
      method: 'logoutDevUser',
      flag: 'success',
      purpose: 'Dev logout complete'
    });

    return true;
  } catch (error) {
    log('authHandlerDev.js', 'logoutDevUser', 'error', 'Dev logout error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'logoutDevUser_error',
      file: 'authHandlerDev.js',
      method: 'logoutDevUser',
      flag: 'error',
      purpose: 'Dev logout failed'
    });
    return false;
  }
}

/**
 * @function refreshDevToken
 * @description Mock token refresh for development
 * @returns {Promise<object>} New tokens
 */
async function refreshDevToken() {
  log('authHandlerDev.js', 'refreshDevToken', 'start', 'Refreshing dev token', {});
  window.performanceTracker.step({
    step: 'refreshDevToken_start',
    file: 'authHandlerDev.js',
    method: 'refreshDevToken',
    flag: 'start',
    purpose: 'Mock token refresh'
  });

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const newTokens = {
      idToken: pendingTokens?.idToken || localStorage.getItem('idToken'),
      accessToken: mockCredentials.accessToken,
      refreshToken: mockCredentials.refreshToken
    };

    log('authHandlerDev.js', 'refreshDevToken', 'success', 'Dev token refreshed', {});
    window.performanceTracker.step({
      step: 'refreshDevToken_complete',
      file: 'authHandlerDev.js',
      method: 'refreshDevToken',
      flag: 'success',
      purpose: 'Token refresh complete'
    });

    return newTokens;
  } catch (error) {
    log('authHandlerDev.js', 'refreshDevToken', 'error', 'Token refresh error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'refreshDevToken_error',
      file: 'authHandlerDev.js',
      method: 'refreshDevToken',
      flag: 'error',
      purpose: 'Token refresh failed'
    });
    throw error;
  }
}

/**
 * @function updateDevUserAttributes
 * @description Mock attribute update for development
 * @param {object} attributes - Attributes to update
 * @returns {Promise<boolean>} Success status
 */
async function updateDevUserAttributes(attributes) {
  log('authHandlerDev.js', 'updateDevUserAttributes', 'start', 'Updating dev user attributes', { attributeKeys: Object.keys(attributes) });
  window.performanceTracker.step({
    step: 'updateDevUserAttributes_start',
    file: 'authHandlerDev.js',
    method: 'updateDevUserAttributes',
    flag: 'start',
    purpose: 'Mock attribute update'
  });

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    log('authHandlerDev.js', 'updateDevUserAttributes', 'success', 'Dev attributes updated', { attributes });
    window.performanceTracker.step({
      step: 'updateDevUserAttributes_complete',
      file: 'authHandlerDev.js',
      method: 'updateDevUserAttributes',
      flag: 'success',
      purpose: 'Attribute update complete'
    });

    return true;
  } catch (error) {
    log('authHandlerDev.js', 'updateDevUserAttributes', 'error', 'Attribute update error', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'updateDevUserAttributes_error',
      file: 'authHandlerDev.js',
      method: 'updateDevUserAttributes',
      flag: 'error',
      purpose: 'Attribute update failed'
    });
    return false;
  }
}

/**
 * @function getCurrentDevUser
 * @description Get current dev user
 * @returns {object} Mock user data
 */
function getCurrentDevUser() {
  log('authHandlerDev.js', 'getCurrentDevUser', 'start', 'Getting current dev user', {});
  window.performanceTracker.step({
    step: 'getCurrentDevUser_start',
    file: 'authHandlerDev.js',
    method: 'getCurrentDevUser',
    flag: 'start',
    purpose: 'Get current dev user'
  });

  log('authHandlerDev.js', 'getCurrentDevUser', 'success', 'Returning mock user', { email: mockUser.email });
  window.performanceTracker.step({
    step: 'getCurrentDevUser_complete',
    file: 'authHandlerDev.js',
    method: 'getCurrentDevUser',
    flag: 'success',
    purpose: 'Dev user returned'
  });

  return mockUser;
}

/**
 * @function mockUserRole
 * @description Mock different user roles for testing
 * @param {string} role - Role to simulate
 * @returns {void}
 */
function mockUserRole(role) {
  log('authHandlerDev.js', 'mockUserRole', 'start', 'Mocking user role', { role });
  window.performanceTracker.step({
    step: 'mockUserRole_start',
    file: 'authHandlerDev.js',
    method: 'mockUserRole',
    flag: 'start',
    purpose: 'Mock user role for testing'
  });

  mockUser.role = role;
  mockUser.raw['custom:role'] = role;

  log('authHandlerDev.js', 'mockUserRole', 'success', 'User role mocked', { role });
  window.performanceTracker.step({
    step: 'mockUserRole_complete',
    file: 'authHandlerDev.js',
    method: 'mockUserRole',
    flag: 'success',
    purpose: 'Role mocking complete'
  });
}

/**
 * @function validateDevToken
 * @description Mock token validation (always returns true in dev)
 * @param {string} token - Token to validate
 * @returns {Promise<boolean>} Always true
 */
async function validateDevToken(token) {
  log('authHandlerDev.js', 'validateDevToken', 'start', 'Validating dev token', { hasToken: !!token });
  window.performanceTracker.step({
    step: 'validateDevToken_start',
    file: 'authHandlerDev.js',
    method: 'validateDevToken',
    flag: 'start',
    purpose: 'Mock token validation'
  });

  log('authHandlerDev.js', 'validateDevToken', 'success', 'Token validation bypassed (dev mode)', {});
  window.performanceTracker.step({
    step: 'validateDevToken_complete',
    file: 'authHandlerDev.js',
    method: 'validateDevToken',
    flag: 'success',
    purpose: 'Token validation complete'
  });

  return true;
}

// Export handler object with all methods
export const authHandlerDev = {
  login: authenticateDevUser,
  signup: registerDevUser,
  handleCallback: handleDevCallback,
  restoreSession: restoreDevSession,
  logout: logoutDevUser,
  refreshToken: refreshDevToken,
  updateProfileAttributes: updateDevUserAttributes,
  getCurrentUser: getCurrentDevUser,
  mockUserRole,
  validateToken: validateDevToken,
  signJwtHS256
};

