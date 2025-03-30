import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initEmailJS } from './config/emailjs';
import { UserProvider } from './context/UserContext';

// Auth Pages
import Login from "./pages/auth/Login/Login";
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ActivateAccount from './pages/auth/ActivateAccount';

// Main Pages
import Dashboard from './pages/dashboard.jsx';
import Contact from './pages/Contact.jsx';
import Transactions from './pages/transactions.jsx';

// User Pages
import Profile from './pages/user/Profile.jsx';
import DeleteUser from './pages/user/DeleteUser.jsx';

// Account Pages
import DeleteAccount from './pages/delete-account.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import TestConnection from './components/TestConnection';
import RedirectRoute from './components/RedirectRoute';

function App() {
  useEffect(() => {
    // Initialize EmailJS
    initEmailJS();
  }, []);

  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RedirectRoute to="/login" />} />
          {/* Removed /index route as it's redundant */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activate-account" element={<ActivateAccount />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/test-connection" element={<TestConnection />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Transactions Route */}
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          
          {/* User Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <DeleteUser />
            </ProtectedRoute>
          } />
          
          {/* ✅ Fix đường dẫn cho Delete Account */}
          <Route path="/account/delete" element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<RedirectRoute to="/login" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
