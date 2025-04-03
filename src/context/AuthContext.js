import { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_ENDPOINTS } from '../config/api';
import { refreshCsrfToken } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [timezone, setTimezone] = useState(() => {
    // Try to get the user's timezone automatically
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // If it's a US timezone, return it, otherwise default to America/New_York
      return userTimeZone.startsWith('America/') ? userTimeZone : 'America/New_York';
    } catch (error) {
      return 'America/New_York'; // Default to EST/EDT
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');

        // Refresh CSRF token first (dummy function now)
        await refreshCsrfToken();

        // Use session-based authentication
        const res = await fetch(AUTH_ENDPOINTS.GET_ME, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Auth data from session:', data);

          if (data.user) {
            setUser(data.user);

            // Check if user has Google tokens
            if (!data.user.hasTokens) {
              console.warn('User is authenticated but has no Google tokens');
            } else {
              console.log('User has Google tokens available');
            }
          } else {
            console.log('No user in session');
            setUser(null);
          }
        } else {
          console.log(`Session auth failed: ${res.status}`);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      // Refresh CSRF token before logout
      await refreshCsrfToken();

      // Session-based logout
      await fetch(AUTH_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token will be added by fetchWithAuth
        }
      });

      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
    }
  };

  // Get the current timezone abbreviation (e.g., EST or EDT)
  const getTimezoneAbbr = () => {
    const date = new Date();
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    }).split(' ')[2];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        timezone,
        setTimezone,
        timezoneAbbr: getTimezoneAbbr()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}