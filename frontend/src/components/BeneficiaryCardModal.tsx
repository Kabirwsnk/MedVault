import React, { useState } from 'react';
import { Patient } from '../types';
import { api } from '../api/client';
import { X, FileDown, QrCode, Shield, User, Sparkles, Copy, Check } from 'lucide-react';

interface BeneficiaryCardModalProps {
  patient: Patient;
  onClose: () => void;
}

export const BeneficiaryCardModal: React.FC<BeneficiaryCardModalProps> = ({ patient, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const copyId = () => {
    navigator.clipboard.writeText(patient.beneficiary_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '2rem',
          position: 'relative',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), var(--shadow-glow-cyan)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} color="#0a0f1d" strokeWidth={2.5} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Digital Beneficiary Card</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Universal National Health ID Token
            </span>
          </div>
        </div>

        {/* Card View Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${activeSide === 'front' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '0.375rem', fontSize: '0.8125rem' }}
            onClick={() => setActiveSide('front')}
          >
            Front Identity Side
          </button>
          <button
            className={`btn ${activeSide === 'back' ? 'btn-emerald' : 'btn-outline'}`}
            style={{ flex: 1, padding: '0.375rem', fontSize: '0.8125rem' }}
            onClick={() => setActiveSide('back')}
          >
            Back Clinical & QR Side
          </button>
        </div>

        {/* Physical Card Mock */}
        {activeSide === 'front' ? (
          <div
            className="animate-fade-in"
            style={{
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              padding: '1.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}
          >
            {/* Background Hologram Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '180px',
                height: '100%',
                background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  MEDVAULT DIGITAL HEALTH
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f8fafc' }}>
                  National Beneficiary Identity
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Sparkles size={14} color="var(--accent-secondary)" />
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>VERIFIED</span>
              </div>
            </div>

            {/* Main Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              {/* Photo Avatar */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                }}
              >
                <User size={40} />
              </div>

              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  {patient.full_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="font-mono" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {patient.beneficiary_id}
                  </span>
                  <button
                    onClick={copyId}
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: '4px',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Meta Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>BLOOD GROUP</span>
                <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{patient.blood_group || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>GENDER</span>
                <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{patient.gender || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>DATE OF BIRTH</span>
                <strong style={{ color: '#f8fafc', fontSize: '0.875rem' }}>{patient.date_of_birth || 'N/A'}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="animate-fade-in"
            style={{
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '1.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  CLINICAL DATA & EMERGENCY
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Phone: </span>
                  <strong style={{ color: '#f8fafc' }}>{patient.phone_number}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Emergency Contact: </span>
                  <strong style={{ color: '#f8fafc' }}>{patient.emergency_contact || 'N/A'}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Aadhaar Hash: </span>
                  <span className="font-mono" style={{ color: '#cbd5e1' }}>
                    XXXX-XXXX-{patient.aadhar_number.slice(-4)}
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={api.getQrCodeUrl(patient.beneficiary_id)}
                  alt={`QR for ${patient.beneficiary_id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
              }}
            >
              Scan this QR token at participating clinics or hospital pharmacies for instant health record access.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={api.getPdfCardUrl(patient.beneficiary_id)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <FileDown size={17} />
            <span>Download Official PDF Card</span>
          </a>
          <a
            href={api.getQrCodeUrl(patient.beneficiary_id)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <QrCode size={17} />
            <span>Open Raw QR Image</span>
          </a>
        </div>
      </div>
    </div>
  );
};
