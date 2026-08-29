import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Patient, PatientCreateRequest } from '../types';
import { BeneficiaryCardModal } from '../components/BeneficiaryCardModal';
import { EditPatientModal } from '../components/EditPatientModal';
import {
  UserPlus,
  FileDown,
  AlertCircle,
  Sparkles,
  Search,
  Users,
  Edit,
  Eye,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';


export const RegistrationPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Form State
  const [formData, setFormData] = useState<PatientCreateRequest>({
    full_name: '',
    phone_number: '',
    aadhar_number: '',
    blood_group: 'O+',
    date_of_birth: '1996-06-20',
    gender: 'Male',
    height_cm: 175,
    weight_kg: 70,
    emergency_contact: '+91 9876543210',
  });

  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [selectedPatientForCard, setSelectedPatientForCard] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err: any) {
      console.error('Failed to load patient directory:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }
    setIsLoadingPatients(true);
    try {
      const results = await api.searchPatients(searchQuery.trim());
      setPatients(results);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const calculateBmi = (heightCm?: number, weightKg?: number) => {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    const bmi = (weightKg / (heightM * heightM)).toFixed(1);
    let category = 'Normal';
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) category = 'Underweight';
    else if (bmiNum >= 25 && bmiNum < 30) category = 'Overweight';
    else if (bmiNum >= 30) category = 'Obese';
    return { bmi, category };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessBanner(null);

    // Clean Aadhaar (remove spaces)
    const rawAadhaar = formData.aadhar_number.replace(/\s+/g, '');
    if (rawAadhaar.length !== 12 || !/^\d+$/.test(rawAadhaar)) {
      setError('Aadhaar number must contain exactly 12 numeric digits.');
      setIsLoading(false);
      return;
    }

    try {
      const patient = await api.createPatient({
        ...formData,
        aadhar_number: rawAadhaar,
      });
      setCreatedPatient(patient);
      setSelectedPatientForCard(patient);
      setSuccessBanner(`Beneficiary ${patient.full_name} registered with unique ID: ${patient.beneficiary_id}`);
      await loadPatients();
    } catch (err: any) {
      setError(err?.message || 'Failed to register patient. Verify that Aadhaar number is unique.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientUpdated = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.beneficiary_id === updated.beneficiary_id ? updated : p)));
    setSuccessBanner(`Demographics for ${updated.full_name} (${updated.beneficiary_id}) updated.`);
  };

  const bmiInfo = calculateBmi(formData.height_cm, formData.weight_kg);
  const age = calculateAge(formData.date_of_birth);

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <UserPlus size={22} color="var(--accent-warning)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Registration Worker Station</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Mint deterministic Beneficiary IDs, manage patient records, and export printable digital health cards.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('register')}
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            <UserPlus size={15} />
            <span>New Registration</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`btn ${activeTab === 'directory' ? 'btn-emerald' : 'btn-outline'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            <Users size={15} />
            <span>Beneficiary Directory ({patients.length})</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="alert alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Tab 1: Registration Form */}
      {activeTab === 'register' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem' }}>Beneficiary Intake Form</h3>

            {error && (
              <div className="alert alert-error animate-fade-in">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Priya Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="+91 9876543210"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar Number (12 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    className="form-input font-mono"
                    placeholder="1234 5678 9012"
                    value={formData.aadhar_number}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = v.replace(/(\d{4})(?=\d)/g, '$1 ');
                      setFormData({ ...formData, aadhar_number: formatted });
                    }}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
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

                <div className="form-group">
                  <label className="form-label">
                    Date of Birth {age !== null && <span style={{ color: 'var(--accent-primary)' }}>({age} yrs)</span>}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                    value={formData.height_cm || ''}
                    onChange={(e) => setFormData({ ...formData, height_cm: parseInt(e.target.value) || undefined })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.weight_kg || ''}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Spouse / Parent name and phone"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-emerald"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                {isLoading ? (
                  <span>Minting Beneficiary ID with Advisory Lock...</span>
                ) : (
                  <>
                    <Sparkles size={17} />
                    <span>Register & Generate Beneficiary ID</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Live Health & ID Preview */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.25rem' }}>Intake Summary & Metrics</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Calculated BMI
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {bmiInfo ? `${bmiInfo.bmi} kg/m²` : 'N/A'}
                  </span>
                  {bmiInfo && <span className="badge badge-cyan">{bmiInfo.category}</span>}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Identity Security Protocol
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Beneficiary IDs are locked using PostgreSQL advisory lock <code className="font-mono">260001</code> to guarantee serial uniqueness and zero duplicate assignments under multi-desk concurrency.
                </p>
              </div>
            </div>

            {createdPatient && (
              <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#6ee7b7' }}>Beneficiary Minted!</h4>
                  <span className="badge badge-cyan font-mono">{createdPatient.beneficiary_id}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                  <strong>{createdPatient.full_name}</strong> is now registered.
                </p>
                <button
                  onClick={() => setSelectedPatientForCard(createdPatient)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Eye size={16} />
                  <span>Open Identity Card Modal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Beneficiary Directory */}
      {activeTab === 'directory' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Search Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name or Beneficiary ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                />
                <Search
                  size={16}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem' }}>
                Search
              </button>
            </form>

            <button onClick={loadPatients} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
              <RefreshCw size={14} />
              <span>Refresh Directory</span>
            </button>
          </div>

          {/* Patients Table */}
          {isLoadingPatients ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading patient directory...
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No registered beneficiaries match your search criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Beneficiary ID</th>
                    <th style={{ padding: '0.75rem' }}>Full Name</th>
                    <th style={{ padding: '0.75rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem' }}>Blood Group</th>
                    <th style={{ padding: '0.75rem' }}>Gender & DOB</th>
                    <th style={{ padding: '0.75rem' }}>Aadhaar</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.beneficiary_id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }} className="font-mono">
                        <span style={{ color: 'var(--accent-primary)' }}>{p.beneficiary_id}</span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                        {p.full_name}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.phone_number}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-cyan">{p.blood_group || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.gender || 'N/A'} ({p.date_of_birth || 'N/A'})
                      </td>
                      <td style={{ padding: '0.75rem' }} className="font-mono text-dim">
                        XXXX-XXXX-{p.aadhar_number.slice(-4)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => setSelectedPatientForCard(p)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            title="View Health Card"
                          >
                            <Eye size={13} />
                            <span>Card</span>
                          </button>
                          <button
                            onClick={() => setSelectedPatientForEdit(p)}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            title="Edit Demographics"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>
                          <a
                            href={api.getPdfCardUrl(p.beneficiary_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-emerald"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            title="Download PDF"
                          >
                            <FileDown size={13} />
                            <span>PDF</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedPatientForCard && (
        <BeneficiaryCardModal
          patient={selectedPatientForCard}
          onClose={() => setSelectedPatientForCard(null)}
        />
      )}

      {selectedPatientForEdit && (
        <EditPatientModal
          patient={selectedPatientForEdit}
          onClose={() => setSelectedPatientForEdit(null)}
          onUpdated={handlePatientUpdated}
        />
      )}
    </div>
  );
};
