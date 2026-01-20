import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/sonner';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import MoodCheckin from './pages/MoodCheckin';
import VentingChat from './pages/VentingChat';
import Diary from './pages/Diary';
import Strategies from './pages/Strategies';
import Articles from './pages/Articles';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected User Routes */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mood-checkin" element={<MoodCheckin />} />
              <Route path="/venting-chat" element={<VentingChat />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/payment/success" element={<Subscription />} />
              <Route path="/payment/cancel" element={<Subscription />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
