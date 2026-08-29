import React, { useState } from 'react';
import { Patient } from '../types';
import { api } from '../api/client';
import { X, Save, AlertCircle } from 'lucide-react';

interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdated: (updatedPatient: Patient) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onClose, onUpdated }) => {
  const [phoneNumber, setPhoneNumber] = useState(patient.phone_number);
  const [bloodGroup, setBloodGroup] = useState(patient.blood_group || 'O+');
  const [dateOfBirth, setDateOfBirth] = useState(patient.date_of_birth || '');
  const [gender, setGender] = useState(patient.gender || 'Male');
  const [heightCm, setHeightCm] = useState<number | undefined>(patient.height_cm || undefined);
  const [weightKg, setWeightKg] = useState<number | undefined>(patient.weight_kg || undefined);
  const [emergencyContact, setEmergencyContact] = useState(patient.emergency_contact || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updated = await api.updatePatient(patient.beneficiary_id, {
        phone_number: phoneNumber,
        blood_group: bloodGroup,
        date_of_birth: dateOfBirth || undefined,
        gender,
        height_cm: heightCm ? Number(heightCm) : undefined,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        emergency_contact: emergencyContact || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update demographics');
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: '560px',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          Edit Patient Demographics
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          Beneficiary: <strong style={{ color: 'var(--accent-primary)' }}>{patient.full_name}</strong> ({patient.beneficiary_id})
        </p>

        {error && (
          <div className="alert alert-error animate-fade-in">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                required
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={heightCm || ''}
                onChange={(e) => setHeightCm(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={weightKg || ''}
                onChange={(e) => setWeightKg(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact Info</label>
            <input
              type="text"
              className="form-input"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-emerald" style={{ flex: 1 }}>
              <Save size={16} />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
