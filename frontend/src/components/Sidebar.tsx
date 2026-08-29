import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Stethoscope,
  Pill,
  UserPlus,
  HeartPulse,
  Bot,
  ShieldCheck,
  PackageSearch,
  CreditCard,
  History,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const getLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-md)',
    color: isActive ? '#f8fafc' : 'var(--text-muted)',
    background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    transition: 'all var(--transition-fast)',
  });

  return (
    <aside
      style={{
        width: '240px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'rgba(10, 15, 29, 0.7)',
        backdropFilter: 'blur(12px)',
        padding: '1.25rem 0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            letterSpacing: '0.08em',
            padding: '0 0.5rem 0.5rem 0.5rem',
          }}
        >
          General
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink to="/" style={getLinkStyle} end>
            <LayoutDashboard size={18} color="var(--accent-primary)" />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/ai-assistant" style={getLinkStyle}>
            <Bot size={18} color="#a855f7" />
            <span>AI Clinical Assistant</span>
          </NavLink>
        </nav>
      </div>

      {/* Role-Specific Sections */}
      {user && (user.role === 'doctor' || user.role === 'admin') && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              padding: '0 0.5rem 0.5rem 0.5rem',
            }}
          >
            Clinical
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <NavLink to="/doctor" style={getLinkStyle}>
              <Stethoscope size={18} color="var(--accent-primary)" />
              <span>Doctor Portal</span>
            </NavLink>
            <NavLink to="/doctor/timeline" style={getLinkStyle}>
              <History size={18} color="#38bdf8" />
              <span>Patient Timeline</span>
            </NavLink>
          </nav>
        </div>
      )}

      {user && (user.role === 'pharmacy' || user.role === 'admin') && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              padding: '0 0.5rem 0.5rem 0.5rem',
            }}
          >
            Pharmacy & Stock
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <NavLink to="/pharmacy" style={getLinkStyle}>
              <Pill size={18} color="var(--accent-secondary)" />
              <span>Pharmacy Queue</span>
            </NavLink>
            <NavLink to="/pharmacy/inventory" style={getLinkStyle}>
              <PackageSearch size={18} color="#34d399" />
              <span>Stock Catalog</span>
            </NavLink>
          </nav>
        </div>
      )}

      {user && (user.role === 'registration_worker' || user.role === 'admin') && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              padding: '0 0.5rem 0.5rem 0.5rem',
            }}
          >
            Registration
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <NavLink to="/registration" style={getLinkStyle}>
              <UserPlus size={18} color="var(--accent-warning)" />
              <span>Register Patient</span>
            </NavLink>
            <NavLink to="/registration/cards" style={getLinkStyle}>
              <CreditCard size={18} color="#fbbf24" />
              <span>Beneficiary Cards</span>
            </NavLink>
          </nav>
        </div>
      )}

      {user && user.role === 'patient' && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              padding: '0 0.5rem 0.5rem 0.5rem',
            }}
          >
            My Health
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <NavLink to="/patient" style={getLinkStyle}>
              <HeartPulse size={18} color="#f43f5e" />
              <span>Health Records</span>
            </NavLink>
          </nav>
        </div>
      )}

      {user && user.role === 'admin' && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              padding: '0 0.5rem 0.5rem 0.5rem',
            }}
          >
            Administration
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <NavLink to="/admin" style={getLinkStyle}>
              <ShieldCheck size={18} color="var(--accent-purple)" />
              <span>Staff Provisioning</span>
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  );
};
