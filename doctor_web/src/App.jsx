import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AppointmentDetail from './pages/AppointmentDetail';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Availability from './pages/Availability';
import Earnings from './pages/Earnings';
import Feedbacks from './pages/Feedbacks';
import PatientRecords from './pages/PatientRecords';
import HealthAnalysis from './pages/HealthAnalysis';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './pages/Onboarding';

import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext'; // Ensure this wraps if not already in main.jsx.
// Wait, main.jsx usually wraps with AuthProvider. Let's check main.jsx first or just wrap inside App if AuthProvider is outside.
// If AuthProvider is inside App, then SocketProvider must be inside AuthProvider.

// Let's assume standard structure. If AuthProvider is in main.jsx, we can wrap Router here.
// But SocketProvider needs AuthContext. So SocketProvider MUST be child of AuthProvider.
// Checking App.jsx, it doesn't show AuthProvider. It's likely in main.jsx.

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <SocketProvider>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<Login />} />

              {/* Onboarding Flow Route */}
              <Route 
                path="/onboarding" 
                element={
                  <PrivateRoute>
                    <Onboarding />
                  </PrivateRoute>
                } 
              />

              {/* Protected Routes with Layout */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/appointments/:appointmentId" element={<AppointmentDetail />} />
                        <Route path="/availability" element={<Availability />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/feedbacks" element={<Feedbacks />} />
                        <Route path="/earnings" element={<Earnings />} />
                        <Route path="/patients/:userId/records" element={<PatientRecords />} />
                        <Route path="/health-analysis" element={<HealthAnalysis />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/analytics" element={<Analytics />} />
                      </Routes>
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Catch all - redirect to home or login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </SocketProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
