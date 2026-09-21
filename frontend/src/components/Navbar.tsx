import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConnectionStatus } from './ConnectionStatus';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'badge-purple';
      case 'doctor':
        return 'badge-cyan';
      case 'pharmacy':
        return 'badge-emerald';
      case 'registration_worker':
        return 'badge-amber';
      case 'patient':
        return 'badge-cyan';
      default:
        return 'badge-gray';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Shield size={22} color="#0a0f1d" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              MedVault <span style={{ color: 'var(--accent-primary)' }}>AI</span>
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Live API
            </span>
          </div>
        </div>
      </Link>

      {/* Center Status / Features */}
      <ConnectionStatus />

      {/* User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <User size={16} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.email}
                </span>
                <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem' }}>
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
