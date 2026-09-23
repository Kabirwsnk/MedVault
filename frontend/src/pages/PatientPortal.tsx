import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { PatientDashboard } from '../types';
import { HeartPulse, QrCode, FileDown, Shield, Calendar, RefreshCw } from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<PatientDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [user]);

  const loadPatientData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Resolve beneficiary_id from user context or fresh /users/me
      let id = user.beneficiary_id;
      if (!id) {
        try {
          const freshUser = await api.getMe();
          id = freshUser?.beneficiary_id;
        } catch {
          // ignore
        }
      }

      if (!id) {
        setError('Your patient login is active, but is not linked to a Beneficiary ID yet. Please ask the clinic registration worker to link your Beneficiary ID.');
        setLoading(false);
        return;
      }

      const data = await api.getPatientDashboard(id);
      setDashboard(data);
    } catch (err: any) {
      console.error('Patient dashboard load error:', err);
      setError(err?.message || 'Failed to load personal health records.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-body animate-fade-in" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading your Personal Health Vault...</p>
      </div>
    );
  }

  // Safe accessor fallbacks whether top-level or nested
  const beneficiaryId = dashboard?.beneficiary_id || dashboard?.patient?.beneficiary_id || user?.beneficiary_id || '—';
  const fullName = dashboard?.full_name || dashboard?.patient?.full_name || 'Beneficiary';
  const bloodGroup = dashboard?.blood_group || dashboard?.patient?.blood_group || 'N/A';
  const gender = dashboard?.gender || dashboard?.patient?.gender || 'N/A';
  const phone = dashboard?.phone_number || dashboard?.patient?.phone_number || 'N/A';
  const emergencyContact = dashboard?.emergency_contact || dashboard?.patient?.emergency_contact || 'N/A';
  const records = dashboard?.medical_records || [];

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            <HeartPulse size={24} color="#f43f5e" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Personal Health Vault</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Protected clinical history, prescribed regimens, and digital beneficiary credentials.
            </p>
          </div>
        </div>

        <button onClick={loadPatientData} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '580px', margin: '2rem auto' }}>
          <Shield size={40} color="var(--accent-warning)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Account Linkage Notice</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(148, 163, 184, 0.08)', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
            Signed in as: <strong>{user?.email}</strong> (Role: Patient)
          </div>
        </div>
      ) : dashboard ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Digital Health ID Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--accent-primary)" />
              <span>Digital Beneficiary Card</span>
            </h3>

            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #131b2e 0%, #0b0f19 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '1.5rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  MEDVAULT DIGITAL HEALTH
                </span>
                <span className="badge badge-cyan font-mono" style={{ fontSize: '0.875rem', padding: '0.25rem 0.625rem' }}>
                  {beneficiaryId}
                </span>
              </div>

              <div style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem', color: '#f8fafc' }}>
                {fullName}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <div>
                  Blood Group: <strong style={{ color: '#ef4444' }}>{bloodGroup}</strong>
                </div>
                <div>
                  Gender: <strong style={{ color: '#fff' }}>{gender}</strong>
                </div>
                <div>
                  Phone: <strong style={{ color: '#fff' }}>{phone}</strong>
                </div>
                <div>
                  Emergency: <strong style={{ color: '#fff' }}>{emergencyContact}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={api.getPdfCardUrl(beneficiaryId)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
              >
                <FileDown size={16} />
                <span>Download PDF Card</span>
              </a>
              <a
                href={api.getQrCodeUrl(beneficiaryId)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
              >
                <QrCode size={16} />
                <span>View QR Code</span>
              </a>
            </div>
          </div>

          {/* Clinical Encounters & Prescriptions */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--accent-secondary)" />
              <span>Encounter &amp; Prescription Records</span>
            </h3>

            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>No clinical encounters logged yet.</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  When a doctor documents an encounter or prescribes medicines, your clinical history will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto' }}>
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>{rec.diagnosis}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Encounter #' + rec.id}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                      <strong>Summary:</strong> {rec.prescription}
                    </p>

                    {rec.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        "{rec.notes}"
                      </p>
                    )}

                    {rec.prescriptions && rec.prescriptions.length > 0 && (
                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Prescribed Formulations:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                          {rec.prescriptions.map((p) => (
                            <div
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.8125rem',
                                padding: '0.35rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255, 255, 255, 0.03)',
                              }}
                            >
                              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                {p.medicine_name} × {p.quantity} ({p.dosage} · {p.duration})
                              </span>
                              {p.dispensed ? (
                                <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>Dispensed</span>
                              ) : (
                                <span className="badge badge-amber" style={{ fontSize: '0.6875rem' }}>Pending</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
