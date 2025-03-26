import { createContext, useContext, useState, useEffect } from 'react';

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
        const res = await fetch('http://localhost:5000/api/me', {
          credentials: 'include'
        });
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = async () => {
    await fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
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