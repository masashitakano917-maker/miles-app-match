import React, { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import LoginPage from './components/LoginPage';
import { User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.role === 'admin' && (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'customer' && (
        <CustomerDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'professional' && (
        <ProfessionalDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;