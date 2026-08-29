import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Stethoscope,
  Pill,
  UserPlus,
  HeartPulse,
  Bot,
  Shield,
  Layers,
  ArrowUpRight,
  Sparkles,
  Lock,
  Database,
} from 'lucide-react';

import { Link } from 'react-router-dom';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [doctorStats, setDoctorStats] = useState<any>(null);
  const [pharmacyStats, setPharmacyStats] = useState<any>(null);

  useEffect(() => {
    // Check root API
    fetch(import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message || 'Connected'))
      .catch(() => setApiStatus('Offline / Network Error'));

    if (user?.role === 'doctor' || user?.role === 'admin') {
      api.getDoctorStats().then(setDoctorStats).catch(() => {});
    }

    if (user?.role === 'pharmacy' || user?.role === 'admin') {
      api.getPharmacyStats().then(setPharmacyStats).catch(() => {});
    }
  }, [user]);

  return (
    <div className="page-body animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">
              <Sparkles size={13} /> Active Station
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Engine Status: <strong style={{ color: '#6ee7b7' }}>{apiStatus}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
            Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user?.email}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Operating Role: <strong style={{ color: 'var(--text-main)' }}>{user?.role.toUpperCase()}</strong>. Unified identity and secure clinical dispatch.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/ai-assistant" className="btn btn-primary">
            <Bot size={17} />
            <span>AI Clinical Assistant</span>
          </Link>
        </div>
      </div>

      {/* Role Metrics Grid */}
      {doctorStats && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={20} color="var(--accent-primary)" />
            <span>Clinical Hub Metrics</span>
          </h3>
          <div className="grid-3">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Patients Enrolled
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                {doctorStats.total_patients}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Encounters Recorded
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '0.25rem' }}>
                {doctorStats.total_records}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prescriptions Issued
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>
                {doctorStats.total_prescriptions}
              </div>
            </div>
          </div>
        </div>
      )}

      {pharmacyStats && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={20} color="var(--accent-secondary)" />
            <span>Pharmacy & Inventory Status</span>
          </h3>
          <div className="grid-3">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catalog Medicines</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                {pharmacyStats.total_medicines}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Items (&lt; 20)</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
                {pharmacyStats.low_stock_count}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Stock Items (&lt; 10)</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-danger)', marginTop: '0.25rem' }}>
                {pharmacyStats.critical_stock_count}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portals Access Grid */}
      <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Clinical Stations & Portals</h3>
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <Link to="/doctor" className="glass-panel glass-panel-interactive" style={{ padding: '1.75rem', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <Stethoscope size={24} color="var(--accent-primary)" />
            </div>
            <ArrowUpRight size={20} color="var(--text-dim)" />
          </div>
          <h4 style={{ fontSize: '1.1875rem', marginBottom: '0.375rem' }}>Doctor Clinical Station</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Search patients, view longitudinal timelines, write encounter notes, and draft structured prescriptions.
          </p>
        </Link>

        <Link to="/pharmacy" className="glass-panel glass-panel-interactive" style={{ padding: '1.75rem', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Pill size={24} color="var(--accent-secondary)" />
            </div>
            <ArrowUpRight size={20} color="var(--text-dim)" />
          </div>
          <h4 style={{ fontSize: '1.1875rem', marginBottom: '0.375rem' }}>Pharmacy Dispensing Queue</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Execute atomic prescription dispenses with row locks, restock medicines, and review movement audits.
          </p>
        </Link>

        <Link to="/registration" className="glass-panel glass-panel-interactive" style={{ padding: '1.75rem', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <UserPlus size={24} color="var(--accent-warning)" />
            </div>
            <ArrowUpRight size={20} color="var(--text-dim)" />
          </div>
          <h4 style={{ fontSize: '1.1875rem', marginBottom: '0.375rem' }}>Registration Worker Station</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Register new beneficiaries with collision-free IDs, export printable PDF cards, and render QR codes.
          </p>
        </Link>

        <Link to="/patient" className="glass-panel glass-panel-interactive" style={{ padding: '1.75rem', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(244, 63, 94, 0.3)',
              }}
            >
              <HeartPulse size={24} color="#f43f5e" />
            </div>
            <ArrowUpRight size={20} color="var(--text-dim)" />
          </div>
          <h4 style={{ fontSize: '1.1875rem', marginBottom: '0.375rem' }}>Patient Health Vault</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            View personal diagnostic records, active prescriptions, and access digital Beneficiary Identity cards.
          </p>
        </Link>
      </div>

      {/* System Integrity & Architecture Cards */}
      <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Platform Security & Architecture Controls</h3>
      <div className="grid-4">
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
            <Lock size={17} />
            <strong style={{ fontSize: '0.875rem' }}>Advisory Lock</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            PostgreSQL <code className="font-mono">260001</code> lock ensures zero duplicate Beneficiary IDs.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>
            <Database size={17} />
            <strong style={{ fontSize: '0.875rem' }}>Audit Ledger</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Every dispense, restock, and stock adjustment writes an immutable movement log.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#a855f7' }}>
            <Shield size={17} />
            <strong style={{ fontSize: '0.875rem' }}>PHI Guard</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Role-based and object-level permission barrier enforces strict patient data confidentiality.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-warning)' }}>
            <Layers size={17} />
            <strong style={{ fontSize: '0.875rem' }}>Alembic Migrations</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Schema managed strictly via migration revisions with verified column typing.
          </p>
        </div>
      </div>
    </div>
  );
};
