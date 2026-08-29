import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { EnrollmentPage } from './pages/EnrollmentPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { DoctorPortal } from './pages/DoctorPortal';
import { PharmacyPortal } from './pages/PharmacyPortal';
import { RegistrationPortal } from './pages/RegistrationPortal';
import { PatientPortal } from './pages/PatientPortal';
import { AIAssistantView } from './pages/AIAssistantView';
import { AdminPortal } from './pages/AdminPortal';

const AppLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/enroll" element={<EnrollmentPage />} />

          {/* Protected Clinical Stations */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/ai-assistant" element={<AIAssistantView />} />

              {/* Doctor Station */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
                <Route path="/doctor" element={<DoctorPortal />} />
                <Route path="/doctor/timeline" element={<DoctorPortal />} />
              </Route>

              {/* Pharmacy Station */}
              <Route element={<ProtectedRoute allowedRoles={['pharmacy', 'admin']} />}>
                <Route path="/pharmacy" element={<PharmacyPortal />} />
                <Route path="/pharmacy/inventory" element={<PharmacyPortal />} />
              </Route>

              {/* Registration Worker Station */}
              <Route element={<ProtectedRoute allowedRoles={['registration_worker', 'admin']} />}>
                <Route path="/registration" element={<RegistrationPortal />} />
                <Route path="/registration/cards" element={<RegistrationPortal />} />
              </Route>

              {/* Patient Health Vault */}
              <Route element={<ProtectedRoute allowedRoles={['patient', 'admin', 'doctor']} />}>
                <Route path="/patient" element={<PatientPortal />} />
              </Route>

              {/* Admin Provisioning Station */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPortal />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
