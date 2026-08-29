import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-muted)',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid rgba(6, 182, 212, 0.2)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span>Verifying MedVault credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
        <h3 style={{ color: 'var(--accent-danger)', marginBottom: '0.75rem' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your active role (<strong>{user.role.toUpperCase()}</strong>) does not have permission to view this clinical station.
        </p>
        <a href="/" className="btn btn-secondary">
          Return to Overview
        </a>
      </div>
    );
  }

  return <Outlet />;
};
