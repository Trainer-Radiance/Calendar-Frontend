import API_BASE_URL from '../config/api';

// Helper function to add session authentication to fetch requests
export const fetchWithAuth = async (url, options = {}) => {
  try {
    console.log(`Fetching with session auth: ${url}`);

    // Prepare headers
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };

    // Always use session-based authentication
    return fetch(url, {
      ...options,
      credentials: 'include',  // Include cookies for session auth
      headers
    });
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
};

// Dummy function for backward compatibility
export const refreshCsrfToken = async () => {
  return true;
};
