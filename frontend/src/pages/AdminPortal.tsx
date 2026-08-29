import React, { useState } from 'react';
import { api } from '../api/client';
import { ShieldCheck, UserPlus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'registration_worker' | 'pharmacy' | 'admin'>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      await api.registerStaff({ email, password, role });
      setFeedback({ type: 'success', message: `Staff user (${email}) provisioned with role ${role.toUpperCase()}!` });
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Staff registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <ShieldCheck size={22} color="var(--accent-purple)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>System Administration Station</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Staff account provisioning, role matrix assignment, and infrastructure oversight.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <UserPlus size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.1875rem' }}>Provision Clinic Staff Account</h3>
          </div>

          {feedback && (
            <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} animate-fade-in`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleRegisterStaff}>
            <div className="form-group">
              <label className="form-label">Staff Work Email *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="dr.smith@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password (Min 12 Characters) *</label>
              <input
                type="password"
                required
                minLength={12}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
              >
                <option value="doctor">Doctor (Clinical encounters, timeline, AI)</option>
                <option value="pharmacy">Pharmacy (Dispensing, inventory, movements)</option>
                <option value="registration_worker">Registration Worker (Beneficiary enrollment & cards)</option>
                <option value="admin">Administrator (Full system management)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem' }}
            >
              <Sparkles size={16} />
              <span>{isLoading ? 'Provisioning Staff...' : 'Create Staff Account'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
