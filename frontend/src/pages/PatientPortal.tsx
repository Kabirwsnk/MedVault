import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { PatientDashboard } from '../types';
import { HeartPulse, QrCode, FileDown, Shield } from 'lucide-react';

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
      // If user has beneficiary_id, fetch dashboard
      const id = user.beneficiary_id;
      if (!id) {
        setError('Your user account is not currently linked to a Beneficiary ID. Please use the Patient Enrollment portal.');
        setLoading(false);
        return;
      }
      const data = await api.getPatientDashboard(id);
      setDashboard(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load personal health records.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading your Health Vault...
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}
        >
          <HeartPulse size={22} color="#f43f5e" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>My Personal Health Vault</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Protected clinical diagnostic history, prescribed regimens, and digital beneficiary card.
          </p>
        </div>
      </div>

      {error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <Shield size={36} color="var(--accent-warning)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Account Not Linked</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Contact clinic registration staff to link your Beneficiary ID.
          </p>
        </div>
      ) : dashboard ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Card & Demographics */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem' }}>Digital Beneficiary Card</h3>

            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glow)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-glow-cyan)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>MEDVAULT UNIVERSAL ID</span>
                <span className="badge badge-cyan font-mono">{dashboard.patient.beneficiary_id}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {dashboard.patient.full_name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Blood Group: <strong style={{ color: '#fff' }}>{dashboard.patient.blood_group || 'N/A'}</strong> | Gender: <strong style={{ color: '#fff' }}>{dashboard.patient.gender || 'N/A'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href={api.getPdfCardUrl(dashboard.patient.beneficiary_id)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <FileDown size={16} />
                <span>PDF Health Card</span>
              </a>
              <a
                href={api.getQrCodeUrl(dashboard.patient.beneficiary_id)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <QrCode size={16} />
                <span>QR Token</span>
              </a>
            </div>
          </div>

          {/* Clinical Encounters List */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem' }}>Encounter & Prescription History</h3>
            {dashboard.medical_records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No clinical records have been logged yet for your Beneficiary ID.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                {dashboard.medical_records.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{rec.diagnosis}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(rec.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      <strong>Prescription:</strong> {rec.prescription}
                    </p>
                    {rec.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <strong>Doctor Notes:</strong> {rec.notes}
                      </p>
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
