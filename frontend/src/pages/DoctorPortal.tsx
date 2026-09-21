import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Patient } from '../types';
import { Stethoscope, Search, Plus, FileText, CheckCircle2, AlertCircle, History, Sparkles, Bot } from 'lucide-react';
import { ClinicalDraft, deleteClinicalDraft, getClinicalDraft, saveClinicalDraft, syncPendingClinicalDrafts } from '../offlineStore';

export const DoctorPortal: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [notes, setNotes] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftState, setDraftState] = useState<'saved' | 'draft' | 'pending' | 'conflict'>('saved');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    const draftId = `encounter:${selectedPatient.beneficiary_id}`;
    getClinicalDraft(draftId).then((draft) => {
      if (!draft) return;
      setDiagnosis(draft.diagnosis);
      setPrescriptionText(draft.prescription);
      setNotes(draft.notes);
      setDraftState(draft.state);
    }).catch(() => undefined);
  }, [selectedPatient?.beneficiary_id]);

  useEffect(() => {
    if (!selectedPatient || (!diagnosis && !prescriptionText && !notes)) return;
    const timer = window.setTimeout(() => {
      saveClinicalDraft({
        id: `encounter:${selectedPatient.beneficiary_id}`,
        beneficiaryId: selectedPatient.beneficiary_id,
        diagnosis,
        prescription: prescriptionText,
        notes,
        state: 'draft',
        updatedAt: new Date().toISOString(),
        idempotencyKey: crypto.randomUUID(),
      }).then(() => setDraftState('draft')).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [selectedPatient?.beneficiary_id, diagnosis, prescriptionText, notes]);

  useEffect(() => {
    const syncDrafts = async () => {
      if (!navigator.onLine) return;
      const result = await syncPendingClinicalDrafts(async (draft: ClinicalDraft) => {
        await api.createMedicalRecord(draft.beneficiaryId, {
          diagnosis: draft.diagnosis,
          prescription: draft.prescription,
          notes: draft.notes || undefined,
        }, draft.idempotencyKey);
      });
      if (result.conflicts > 0) setDraftState('conflict');
      else if (result.synced > 0) setDraftState('saved');
    };
    syncDrafts().catch(() => undefined);
    window.addEventListener('online', syncDrafts);
    return () => window.removeEventListener('online', syncDrafts);
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        selectPatient(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }
    try {
      const results = await api.searchPatients(searchQuery.trim());
      setPatients(results);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Search failed' });
    }
  };

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setAiSummary(null);
    try {
      const timeline = await api.getPatientTimeline(patient.beneficiary_id);
      setPatientTimeline(timeline);
    } catch (err: any) {
      console.error('Timeline error:', err);
      setPatientTimeline([]);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSubmittingRecord(true);
    setFeedback(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      await api.createMedicalRecord(selectedPatient.beneficiary_id, {
        diagnosis,
        prescription: prescriptionText,
        notes: notes || undefined,
      }, idempotencyKey);
      await deleteClinicalDraft(`encounter:${selectedPatient.beneficiary_id}`);
      setDraftState('saved');
      setFeedback({ type: 'success', message: 'Medical encounter recorded successfully!' });
      setDiagnosis('');
      setPrescriptionText('');
      setNotes('');
      // refresh timeline
      const timeline = await api.getPatientTimeline(selectedPatient.beneficiary_id);
      setPatientTimeline(timeline);
    } catch (err: any) {
      if (!err?.status || err.status === 0) {
        await saveClinicalDraft({
          id: `encounter:${selectedPatient.beneficiary_id}`,
          beneficiaryId: selectedPatient.beneficiary_id,
          diagnosis,
          prescription: prescriptionText,
          notes,
          state: 'pending',
          updatedAt: new Date().toISOString(),
          idempotencyKey: crypto.randomUUID(),
        });
        setDraftState('pending');
        setFeedback({ type: 'error', message: 'Server unavailable. Encounter saved locally and queued for synchronization.' });
        return;
      }
      setFeedback({ type: 'error', message: err.message || 'Failed to save medical record' });
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  const fetchAiSummary = async () => {
    if (!selectedPatient) return;
    setIsLoadingSummary(true);
    try {
      const res = await api.getAISummary(selectedPatient.beneficiary_id);
      setAiSummary(res.summary);
    } catch (err: any) {
      setAiSummary('AI Summary is temporarily unavailable.');
    } finally {
      setIsLoadingSummary(false);
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
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <Stethoscope size={22} color="var(--accent-primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Doctor Clinical Station</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Patient encounters, longitudinal medical history, and clinical documentation.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} animate-fade-in`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Patient List & Search */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search patient name..."
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
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '560px', overflowY: 'auto' }}>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                No patients found
              </div>
            ) : (
              patients.map((p) => {
                const isSelected = selectedPatient?.beneficiary_id === p.beneficiary_id;
                return (
                  <div
                    key={p.beneficiary_id}
                    onClick={() => selectPatient(p)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? '#e7f0f7' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                      {p.full_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      <span className="font-mono" style={{ color: 'var(--accent-primary)' }}>
                        {p.beneficiary_id}
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {p.blood_group || 'Blood N/A'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Details, Timeline & New Encounter */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Patient Header Card */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedPatient.full_name}</h3>
                  <span className="badge badge-cyan font-mono">{selectedPatient.beneficiary_id}</span>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span>Phone: <strong style={{ color: 'var(--text-main)' }}>{selectedPatient.phone_number}</strong></span>
                  <span>DOB: <strong style={{ color: 'var(--text-main)' }}>{selectedPatient.date_of_birth || 'N/A'}</strong></span>
                  <span>Gender: <strong style={{ color: 'var(--text-main)' }}>{selectedPatient.gender || 'N/A'}</strong></span>
                  <span>Blood: <strong style={{ color: 'var(--text-main)' }}>{selectedPatient.blood_group || 'N/A'}</strong></span>
                </div>
              </div>

              <button
                onClick={fetchAiSummary}
                disabled={isLoadingSummary}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem' }}
              >
                <Sparkles size={16} color="var(--accent-primary)" />
                <span>{isLoadingSummary ? 'Generating AI Brief...' : 'AI Clinical Summary'}</span>
              </button>
            </div>

            {/* AI Summary Box if requested */}
            {aiSummary && (
              <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', border: '1px solid rgba(168, 85, 247, 0.4)', background: 'rgba(30, 27, 75, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#c4b5fd' }}>
                  <Bot size={18} />
                  <strong style={{ fontSize: '0.9375rem' }}>MedVault AI Patient Brief</strong>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {aiSummary}
                </div>
              </div>
            )}

            {/* New Encounter Form */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Plus size={18} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '1.0625rem' }}>Record Clinical Encounter</h4>
              </div>

              <form onSubmit={handleCreateRecord}>
                <div className="form-group">
                  <label className="form-label">Clinical Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Viral Bronchitis / Stage 1 Hypertension"
                    className="form-input"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prescription (Text instructions) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Tab Amoxicillin 500mg TDS x 5 days, Paracetamol 650mg SOS"
                    className="form-textarea"
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Notes & Observations (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Patient reports productive cough, chest clear on auscultation..."
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSubmittingRecord}
                  className="btn btn-primary"
                >
                  <FileText size={16} />
                  <span>{isSubmittingRecord ? 'Saving Encounter...' : 'Submit Encounter Record'}</span>
                </button>
                <span style={{ fontSize: '0.75rem', color: draftState === 'conflict' ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                  {draftState === 'draft' && 'Draft saved locally'}
                  {draftState === 'pending' && 'Pending synchronization'}
                  {draftState === 'conflict' && 'Sync conflict requires review'}
                </span>
                </div>
              </form>
            </div>

            {/* Longitudinal Timeline */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <History size={18} color="var(--accent-secondary)" />
                <h4 style={{ fontSize: '1.0625rem' }}>Longitudinal History & Past Records</h4>
              </div>

              {patientTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No prior medical records registered for this beneficiary.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {patientTimeline.map((rec: any, idx: number) => (
                    <div
                      key={rec.id || idx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: '4px solid var(--accent-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{rec.diagnosis}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                        <strong>Rx:</strong> {rec.prescription}
                      </p>
                      {rec.notes && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <strong>Notes:</strong> {rec.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a patient from the directory to view clinical history and record encounters.
          </div>
        )}
      </div>
    </div>
  );
};
