import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Menu } from 'react-feather';
import googleLogo from '../assets/google-logo.svg';
import Logo from './Logo';
import { AUTH_ENDPOINTS } from '../config/api';

export default function Header({ selectedMember, setSelectedMember }) {
  const { user, logout, timezone, setTimezone } = useAuth();
  const [members, setMembers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/members`, {
          credentials: 'include',
        });
        const data = await res.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    if (user) fetchMembers();
  }, [user]);

  const handleMemberClick = (memberId) => {
    setSelectedMember(memberId);
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    window.location.href = AUTH_ENDPOINTS.GOOGLE_LOGIN;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderTeamMembersList = () => {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Team Dashboard</h2>
            <p className="subtitle">Manage your team's calendar access and availability</p>
          </div>
          <div className="dashboard-actions">
            <button 
              className="primary-action-btn"
              onClick={() => handleMemberClick('all')}
            >
              <span className="icon">👥</span>
              <span className="button-text">Combined Calendar View</span>
            </button>
          </div>
        </div>

        <div className="team-grid">
          {members.map((member) => (
            <div key={member.id} className="team-card">
              <div className="card-header">
                <div className="member-avatar" style={{ 
                  backgroundColor: `hsl(${member.id * 60}, 70%, 60%)`
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-status">
                  <div className="status-indicator"></div>
                  <span className="status-text">Active</span>
                </div>
              </div>
              <div className="card-body">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-email">{member.email}</p>
              </div>
              <div className="card-footer">
                <button 
                  className="calendar-btn"
                  onClick={() => handleMemberClick(member.id)}
                >
                  <span className="icon">📅</span>
                  <span className="button-text">View Schedule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`header ${!user ? 'login-header' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="header-main">
          {user && selectedMember && (
            <button 
              className="back-button" 
              onClick={() => setSelectedMember(null)}
            >
              <ArrowLeft size={20} /> 
              <span className="button-text">Back to Members</span>
            </button>
          )}
          <div className="header-left">
            <Logo />
            <h1 className="header-title">Team Calendar</h1>
          </div>
          {user && (
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>
          )}
        </div>

        <div className={`controls ${mobileMenuOpen ? 'show' : ''}`}>
          {user ? (
            <>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="timezone-select"
              >
                <option value="America/New_York">US Eastern Time</option>
                <option value="America/Chicago">US Central Time</option>
                <option value="America/Denver">US Mountain Time</option>
                <option value="America/Los_Angeles">US Pacific Time</option>
                <option value="America/Anchorage">US Alaska Time</option>
                <option value="Pacific/Honolulu">US Hawaii Time</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="UTC">UTC</option>
              </select>
              <button className="login-btn logout-btn" onClick={logout}>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button className="login-btn google-login" onClick={handleLogin}>
              <img src={googleLogo} alt="Google" className="google-icon" />
              <span>Login with Google</span>
            </button>
          )}
        </div>
      </div>
      
      {user && !selectedMember && renderTeamMembersList()}
    </>
  );
}