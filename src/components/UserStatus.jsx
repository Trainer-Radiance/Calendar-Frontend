import { useAuth } from '../context/AuthContext';

const UserStatus = () => {
  const { user, timezoneAbbr } = useAuth();

  return (
    <div className="user-status">
      {user ? (
        <div className="status-content">
          <span role="img" aria-label="user">👤</span> Logged in as: 
          <strong>{user.email}</strong>
          <span className="timezone-info">
            (Timezone: {timezoneAbbr})
          </span>
        </div>
      ) : (
        <div className="status-content">
          <span role="img" aria-label="lock">🔒</span> Please login to view calendar availability
        </div>
      )}
    </div>
  );
};

export default UserStatus;