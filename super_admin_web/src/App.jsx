import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Settlements from './pages/Settlements';
import BloodDonations from './pages/BloodDonations';
import Refunds from './pages/Refunds';
import Settings from './pages/Settings';
import FeeSettings from './pages/FeeSettings';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import BloodRequests from './pages/BloodRequests';
import Notifications from './pages/Notifications';
import Admins from './pages/Admins';
import Reviews from './pages/Reviews';
import AppFeedback from './pages/AppFeedback';
import Support from './pages/Support';
import DoctorDetails from './pages/DoctorDetails';
import UserDetails from './pages/UserDetails';
import AdvancedReports from './pages/AdvancedReports';
import SystemAdministration from './pages/SystemAdministration';
import UserActivityTracking from './pages/UserActivityTracking';
import EmailManagement from './pages/EmailManagement';
import APIMonitoring from './pages/APIMonitoring';
import ContentManagement from './pages/ContentManagement';
import InsurancePartners from './pages/InsurancePartners';
import Campaigns from './pages/Campaigns';
import DataBackup from './pages/DataBackup';
import Coupons from './pages/Coupons';
import Layout from './components/Layout';

function AppContent() {
  const { isSessionValid, loading } = useAdminAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isSessionValid) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetails />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/settlements" element={<Settlements />} />
        <Route path="/blood-donations" element={<BloodDonations />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/fee-settings" element={<FeeSettings />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/blood-requests" element={<BloodRequests />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/app-feedback" element={<AppFeedback />} />
        <Route path="/admins" element={<Admins />} />
        <Route path="/support" element={<Support />} />
        <Route path="/advanced-reports" element={<AdvancedReports />} />
        <Route path="/system-admin" element={<SystemAdministration />} />
        <Route path="/activity-tracking" element={<UserActivityTracking />} />
        <Route path="/email-management" element={<EmailManagement />} />
        <Route path="/api-monitoring" element={<APIMonitoring />} />
        <Route path="/content-management" element={<ContentManagement />} />
        <Route path="/insurance-partners" element={<InsurancePartners />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/data-backup" element={<DataBackup />} />
        <Route path="/coupons" element={<Coupons />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <SocketProvider>
          <AppContent />
          <Toaster position="top-right" />
        </SocketProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
