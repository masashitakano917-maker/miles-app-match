import React, { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import { User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowSignUp(false);
  };

  const handleShowSignUp = () => {
    setShowSignUp(true);
  };

  const handleShowLogin = () => {
    setShowSignUp(false);
  };

  if (!currentUser) {
    if (showSignUp) {
      return <SignUpPage onSignUp={handleLogin} onShowLogin={handleShowLogin} />;
    }
    return <LoginPage onLogin={handleLogin} onShowSignUp={handleShowSignUp} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
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