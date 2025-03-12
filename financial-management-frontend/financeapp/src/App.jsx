import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initEmailJS } from './config/emailjs';

// Auth Pages
import Login from "./pages/auth/Login/Login";
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ActivateAccount from './pages/auth/ActivateAccount';

// Main Pages
import Dashboard from './pages/dashboard.jsx';
import Home from './pages/home.jsx';
import Contact from './pages/Contact.jsx';
import Index from './pages/Index.jsx';

// User Pages
import Profile from './pages/user/Profile.jsx';
import DeleteUser from './pages/user/DeleteUser.jsx';

// Account Pages
import DeleteAccount from './pages/account/DeleteAccount.jsx';

function App() {
  useEffect(() => {
    // Initialize EmailJS
    initEmailJS();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/index" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* User Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/users" element={<DeleteUser />} />
        
        {/* Account Routes */}
        <Route path="/account/delete" element={<DeleteAccount />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 