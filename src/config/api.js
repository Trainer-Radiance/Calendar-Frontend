// Determine if we're in production based on the current hostname
const isProduction = window.location.hostname !== 'localhost';

// Use the correct API URL based on environment
const API_BASE_URL = isProduction 
  ? 'https://server-tau-one-67.vercel.app'
  : 'http://localhost:5000';

// Log the environment for debugging
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
console.log(`API Base URL: ${API_BASE_URL}`);

// Auth endpoints
export const AUTH_ENDPOINTS = {
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  LOGOUT: `${API_BASE_URL}/logout`,
  GET_ME: `${API_BASE_URL}/api/me`,
};

// Data endpoints
export const DATA_ENDPOINTS = {
  MEMBERS: `${API_BASE_URL}/api/members`,
  AVAILABILITY: (memberId) => `${API_BASE_URL}/api/availability/${memberId}`,
};

export default API_BASE_URL; 