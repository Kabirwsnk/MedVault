import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-warm the backend on initial page visit (wakes up free tier before user submits)
  useEffect(() => {
    api.health().catch(() => {});
  }, []);

  // Show cold-start wake-up notice if login takes > 2.5 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timer = setTimeout(() => setIsWakingUp(true), 2500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      const currentUser = await api.getMe().catch(() => null);
      if (currentUser?.role === 'patient') {
        navigate('/patient');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials or connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Left Side: Brand & Feature Highlights */}
        <div
          style={{
            padding: '3rem 2.5rem',
            background: '#e7f0f7',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                }}
              >
                <Shield size={26} color="#ffffff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                MedVault
              </h2>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Unified, role-protected clinical identity platform. Secure patient records, atomic pharmacy dispensing, and cryptographic health IDs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={18} color="var(--accent-primary)" />
                <span>Deterministic Beneficiary ID generation (`MV26XXXX`)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={18} color="var(--accent-secondary)" />
                <span>Atomic inventory movement & audit ledger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                <CheckCircle2 size={18} color="#a855f7" />
                <span>Object-level PHI authorization & role guard</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Presets (Development)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPreset('admin@local.test', 'AdminSecurePassword123!')}
              >
                Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPreset('doctor@medvault.test', 'DoctorSecurePassword123!')}
              >
                Doctor
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPreset('pharmacy@medvault.test', 'PharmacySecurePassword123!')}
              >
                Pharmacy
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPreset('worker@medvault.test', 'WorkerSecurePassword123!')}
              >
                Registration
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
                onClick={() => setPreset('patient@medvault.test', 'PatientSecurePassword123!')}
              >
                Patient
              </button>
            </div>

          </div>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>Account Sign In</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Enter your clinical credentials to access your station.
            </p>
          </div>

          {error && (
            <div className="alert alert-error animate-fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="doctor@clinic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail
                  size={17}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={17}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
            >
              {isLoading ? (
                <span>Authenticating with JWT...</span>
              ) : (
                <>
                  <span>Sign In to MedVault</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {isWakingUp && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw size={13} className="animate-spin" />
                <span>Waking up cloud server from standby (~25s on free tier)...</span>
              </div>
            )}
          </form>

          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Patient account activation is completed by clinic registration staff.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
