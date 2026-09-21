import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CheckCircle2, AlertCircle, ArrowLeft, UserCheck } from 'lucide-react';

export const EnrollmentPage: React.FC = () => {
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.enrollPatient({
        beneficiary_id: beneficiaryId.trim(),
        email: email.trim(),
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Enrollment failed. Verify that your Beneficiary ID was issued by clinic staff.');
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: '560px',
          padding: '2.5rem',
        }}
      >
        <Link
          to="/registration"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem' }}>Patient Portal Enrollment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Link your clinic-issued Beneficiary ID to your personal account.
            </p>
          </div>
        </div>

        {success ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '1.5rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={30} color="var(--accent-secondary)" />
            </div>
            <h3 style={{ color: '#6ee7b7', marginBottom: '0.5rem' }}>Enrollment Successful!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your Beneficiary ID (<strong>{beneficiaryId}</strong>) is now linked to <strong>{email}</strong>.
            </p>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleEnroll} style={{ marginTop: '1.5rem' }}>
            {error && (
              <div className="alert alert-error animate-fade-in">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Beneficiary ID</label>
              <input
                type="text"
                required
                placeholder="e.g. MV260001"
                className="form-input font-mono"
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value.toUpperCase())}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Printed on your clinic registration slip or health card.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input
                type="email"
                required
                placeholder="patient@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password (Min 12 Characters)</label>
              <input
                type="password"
                required
                minLength={12}
                placeholder="••••••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                required
                minLength={12}
                placeholder="••••••••••••"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-emerald"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {isLoading ? <span>Linking Account...</span> : <span>Complete Patient Enrollment</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
