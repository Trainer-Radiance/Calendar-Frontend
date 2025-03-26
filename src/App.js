import { useState } from 'react';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import UserStatus from './components/UserStatus';
import { useAuth } from './context/AuthContext';

import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <Header selectedMember={selectedMember} setSelectedMember={setSelectedMember} />
      <UserStatus />
      
      <main>
        {user && selectedMember && (
          <CalendarGrid 
            selectedMember={selectedMember} 
            setSelectedMember={setSelectedMember} 
          />
        )}
      </main>
    </div>
  );
}

export default App;