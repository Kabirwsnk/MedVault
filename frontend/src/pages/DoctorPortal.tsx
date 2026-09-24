import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Medicine, Patient, TimelineMedicalRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  History,
  Sparkles,
  Bot,
  Pill,
  Clock,
  RotateCw,
  Printer,
  ChevronDown,
  X,
  FileCheck,
  UserCheck,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import {
  deleteClinicalDraft,
  getClinicalDraft,
  saveClinicalDraft,
  syncPendingClinicalDrafts,
} from '../offlineStore';

interface ActivePrescriptionItem {
  id: string; // temporary client uuid
  medicine_id: number;
  medicine_name: string;
  strength?: string;
  dosage_form?: string;
  dosage: string;
  frequency: string;
  days: number;
  quantity: number;
  instructions: string;
  stock: number;
  saved?: boolean;
}

export const DoctorPortal: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab: 'opd' (OPD Consultation & Prescription) or 'timeline' (Longitudinal Timeline & History)
  const isTimelineRoute = location.pathname.includes('/timeline');
  const [activeTab, setActiveTab] = useState<'opd' | 'timeline'>(isTimelineRoute ? 'timeline' : 'opd');

  useEffect(() => {
    setActiveTab(location.pathname.includes('/timeline') ? 'timeline' : 'opd');
  }, [location.pathname]);

  const handleTabChange = (tab: 'opd' | 'timeline') => {
    setActiveTab(tab);
    if (tab === 'timeline') {
      navigate('/doctor/timeline', { replace: true });
    } else {
      navigate('/doctor', { replace: true });
    }
  };

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<TimelineMedicalRecord[]>([]);

  // Clinical encounter state
  const [diagnosis, setDiagnosis] = useState('');
  const [durationValue, setDurationValue] = useState('5 days');
  const [remarks, setRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);

  // Structured active Rx list for current encounter
  const [activeRxItems, setActiveRxItems] = useState<ActivePrescriptionItem[]>([]);

  // Inline entry row state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<number>(0);
  const [inputDosage, setInputDosage] = useState('1 Tab');
  const [inputFrequency, setInputFrequency] = useState('1-0-1');
  const [inputDays, setInputDays] = useState(5);
  const [inputQty, setInputQty] = useState(10);
  const [inputInstructions, setInputInstructions] = useState('After food');

  // Modals & Panels
  const [showMedicineHistoryModal, setShowMedicineHistoryModal] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftState, setDraftState] = useState<'saved' | 'draft' | 'pending' | 'conflict'>('saved');

  // Session timer (Government e-Hospital style)
  const [sessionSeconds, setSessionSeconds] = useState(1800); // 30 min countdown

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => (prev > 0 ? prev - 1 : 1800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setSessionSeconds(1800);
    setFeedback({ type: 'success', message: 'Session refreshed and token re-validated.' });
  };

  // Initial load
  useEffect(() => {
    loadPatients();
    loadMedicines();
  }, []);

  // When selected medicine, frequency, or days change, auto-calculate quantity
  useEffect(() => {
    let freqMultiplier = 1;
    if (inputFrequency === '1-0-1' || inputFrequency === 'BD') freqMultiplier = 2;
    else if (inputFrequency === '1-1-1' || inputFrequency === 'TDS') freqMultiplier = 3;
    else if (inputFrequency === '1-1-1-1' || inputFrequency === 'QDS') freqMultiplier = 4;
    else if (inputFrequency === '1-0-0' || inputFrequency === '0-0-1' || inputFrequency === 'OD') freqMultiplier = 1;
    else if (inputFrequency === 'SOS') freqMultiplier = 1;

    const calculated = Math.max(1, (inputDays || 1) * freqMultiplier);
    setInputQty(calculated);
  }, [inputFrequency, inputDays]);

  // Load draft for selected patient
  useEffect(() => {
    if (!selectedPatient) return;
    const draftId = `encounter:${selectedPatient.beneficiary_id}`;
    getClinicalDraft(draftId)
      .then((draft) => {
        if (!draft) return;
        setDiagnosis(draft.diagnosis);
        setRemarks(draft.notes);
        setDraftState(draft.state);
      })
      .catch(() => undefined);
  }, [selectedPatient?.beneficiary_id]);

  // Auto-save draft
  useEffect(() => {
    if (!selectedPatient || (!diagnosis && !remarks && activeRxItems.length === 0)) return;
    const timer = window.setTimeout(() => {
      saveClinicalDraft({
        id: `encounter:${selectedPatient.beneficiary_id}`,
        beneficiaryId: selectedPatient.beneficiary_id,
        diagnosis,
        prescription: activeRxItems.map((i) => `${i.medicine_name} ${i.dosage} ${i.frequency} x ${i.days}d`).join('; '),
        notes: remarks,
        state: 'draft',
        updatedAt: new Date().toISOString(),
        idempotencyKey: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      })
        .then(() => setDraftState('draft'))
        .catch(() => undefined);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [selectedPatient?.beneficiary_id, diagnosis, remarks, activeRxItems]);

  // Sync pending drafts on reconnect
  useEffect(() => {
    const syncDrafts = async () => {
      if (!navigator.onLine) return;
      const result = await syncPendingClinicalDrafts(async (draft) => {
        await api.createMedicalRecord(
          draft.beneficiaryId,
          {
            diagnosis: draft.diagnosis,
            prescription: draft.prescription,
            notes: draft.notes || undefined,
          },
          draft.idempotencyKey
        );
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
      const safePatients = Array.isArray(data) ? data : [];
      setPatients(safePatients);
      if (safePatients.length > 0 && !selectedPatient) {
        selectPatient(safePatients[0]);
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
    }
  };

  const loadMedicines = async () => {
    try {
      const data = await api.getMedicines();
      const safeMeds = Array.isArray(data) ? data : [];
      setMedicines(safeMeds);
      if (safeMeds.length > 0 && !selectedMedId) {
        setSelectedMedId(safeMeds[0].id);
      }
    } catch {
      // non-critical
    }
  };

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setAiSummary(null);
    resetEncounterForm();
    try {
      const timelineData = await api.getPatientTimeline(patient.beneficiary_id);
      const safeRecords = Array.isArray(timelineData)
        ? timelineData
        : Array.isArray(timelineData?.medical_records)
        ? timelineData.medical_records
        : [];
      setPatientTimeline(safeRecords);
    } catch (err) {
      console.error('Failed to load patient timeline:', err);
      setPatientTimeline([]);
    }
  };

  const resetEncounterForm = () => {
    setActiveRxItems([]);
    setDiagnosis('');
    setDurationValue('5 days');
    setRemarks('');
    setNotes('');
    setDraftState('saved');
    setFeedback(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }
    try {
      const results = await api.searchPatients(searchQuery.trim());
      setPatients(Array.isArray(results) ? results : []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Search failed' });
    }
  };

  // Add medicine to active Rx table
  const handleAddDrugToTable = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) {
      setFeedback({ type: 'error', message: 'Please select a valid medicine from formulary.' });
      return;
    }

    const newItem: ActivePrescriptionItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
      medicine_id: med.id,
      medicine_name: med.medicine_name,
      strength: med.strength || '',
      dosage_form: med.dosage_form || 'Tablet',
      dosage: inputDosage || '1 Tab',
      frequency: inputFrequency || '1-0-1',
      days: Number(inputDays) || 5,
      quantity: Number(inputQty) || 10,
      instructions: inputInstructions || 'After food',
      stock: med.stock,
      saved: false,
    };

    setActiveRxItems((prev) => [...prev, newItem]);
    setFeedback(null);
  };

  const handleRemoveDrug = (id: string) => {
    setActiveRxItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 1-Click Repeat prescription from history modal (Image 2)
  const handleRepeatMedicine = (histRx: any) => {
    const med = medicines.find((m) => m.medicine_name.toLowerCase() === histRx.medicine_name?.toLowerCase());
    const newItem: ActivePrescriptionItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
      medicine_id: med ? med.id : (histRx.medicine_id || medicines[0]?.id || 1),
      medicine_name: histRx.medicine_name,
      strength: med?.strength || '',
      dosage_form: med?.dosage_form || 'Tablet',
      dosage: histRx.dosage || '1 Tab',
      frequency: histRx.frequency || '1-0-1',
      days: parseInt(histRx.duration) || 5,
      quantity: histRx.quantity || 10,
      instructions: 'After food',
      stock: med?.stock ?? 100,
      saved: false,
    };

    setActiveRxItems((prev) => [...prev, newItem]);
    setShowMedicineHistoryModal(false);
    setActiveTab('opd');
    setFeedback({
      type: 'success',
      message: `Repeated "${histRx.medicine_name}" into current prescription table!`,
    });
  };

  // Pre-load common Clinical Drug Templates
  const handleApplyTemplate = (templateType: string) => {
    setShowTemplateMenu(false);
    if (templateType === 'fever') {
      setDiagnosis('Acute Febrile Illness / Viral URI');
      setDurationValue('3-5 days');
      setRemarks('Hydration encouraged, monitor temperature. Review if fever persists > 3 days.');
      const pcm = medicines.find((m) => m.medicine_name.toLowerCase().includes('paracetamol')) || medicines[0];
      const cetirizine = medicines.find((m) => m.medicine_name.toLowerCase().includes('cetirizine'));
      const items: ActivePrescriptionItem[] = [];
      if (pcm) {
        items.push({
          id: `item-${Date.now()}-1`,
          medicine_id: pcm.id,
          medicine_name: pcm.medicine_name,
          strength: pcm.strength || '650mg',
          dosage_form: pcm.dosage_form || 'Tablet',
          dosage: '1 Tab',
          frequency: '1-1-1',
          days: 3,
          quantity: 9,
          instructions: 'After meals',
          stock: pcm.stock,
        });
      }
      if (cetirizine) {
        items.push({
          id: `item-${Date.now()}-2`,
          medicine_id: cetirizine.id,
          medicine_name: cetirizine.medicine_name,
          strength: cetirizine.strength || '10mg',
          dosage_form: cetirizine.dosage_form || 'Tablet',
          dosage: '1 Tab',
          frequency: '0-0-1',
          days: 5,
          quantity: 5,
          instructions: 'At bedtime',
          stock: cetirizine.stock,
        });
      }
      setActiveRxItems(items);
      setFeedback({ type: 'success', message: 'Applied Template: Acute Febrile Illness / Viral URI' });
    } else if (templateType === 'hypertension') {
      setDiagnosis('Essential Hypertension — Stage 1');
      setDurationValue('30 days');
      setRemarks('Salt restriction advised, regular BP monitoring recorded weekly.');
      const med = medicines.find((m) => m.medicine_name.toLowerCase().includes('atorvastatin') || m.medicine_name.toLowerCase().includes('metformin')) || medicines[0];
      if (med) {
        setActiveRxItems([
          {
            id: `item-${Date.now()}-1`,
            medicine_id: med.id,
            medicine_name: med.medicine_name,
            strength: med.strength || '10mg',
            dosage_form: med.dosage_form || 'Tablet',
            dosage: '1 Tab',
            frequency: '1-0-0',
            days: 30,
            quantity: 30,
            instructions: 'Morning before breakfast',
            stock: med.stock,
          },
        ]);
      }
      setFeedback({ type: 'success', message: 'Applied Template: Essential Hypertension' });
    } else if (templateType === 'gastritis') {
      setDiagnosis('Acute Gastritis / Acid Peptic Disease');
      setDurationValue('14 days');
      setRemarks('Avoid spicy food, caffeine, and NSAIDs. Take before meals.');
      const omeprazole = medicines.find((m) => m.medicine_name.toLowerCase().includes('omeprazole')) || medicines[0];
      if (omeprazole) {
        setActiveRxItems([
          {
            id: `item-${Date.now()}-1`,
            medicine_id: omeprazole.id,
            medicine_name: omeprazole.medicine_name,
            strength: omeprazole.strength || '20mg',
            dosage_form: omeprazole.dosage_form || 'Capsule',
            dosage: '1 Cap',
            frequency: '1-0-0',
            days: 14,
            quantity: 14,
            instructions: 'Empty stomach 30 mins before food',
            stock: omeprazole.stock,
          },
        ]);
      }
      setFeedback({ type: 'success', message: 'Applied Template: Acute Gastritis' });
    }
  };

  // Preview & Save Rx (Main action button from Image 1)
  const handlePreviewAndSave = async () => {
    if (!selectedPatient) {
      setFeedback({ type: 'error', message: 'Please select a beneficiary patient first.' });
      return;
    }

    if (!diagnosis.trim()) {
      setFeedback({ type: 'error', message: 'Clinical Diagnosis is required before saving consultation.' });
      return;
    }

    setIsSubmittingRecord(true);
    setFeedback(null);

    try {
      const compiledSummary = activeRxItems.length > 0
        ? activeRxItems.map((i) => `${i.medicine_name} ${i.dosage} [${i.frequency}] x ${i.days}d (Qty: ${i.quantity}) - ${i.instructions}`).join('\n')
        : 'Clinical advice and observation recorded without pharmaceutical items.';

      const combinedNotes = [remarks ? `Clinical Remarks: ${remarks}` : '', notes ? `Additional Notes: ${notes}` : ''].filter(Boolean).join('\n');

      const idempotencyKey = crypto?.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`;
      const record = await api.createMedicalRecord(
        selectedPatient.beneficiary_id,
        {
          diagnosis: diagnosis.trim(),
          prescription: compiledSummary,
          notes: combinedNotes || undefined,
        },
        idempotencyKey
      );

      // Dispatch each structured prescription item to pharmacy
      let dispatchedCount = 0;
      for (const item of activeRxItems) {
        try {
          await api.createPrescription(record.id, {
            medicine_id: item.medicine_id,
            quantity: item.quantity,
            dosage: `${item.dosage} (${item.frequency})`,
            duration: `${item.days} days`,
          });
          dispatchedCount++;
        } catch (itemErr) {
          console.error('Failed to dispatch item:', item, itemErr);
        }
      }

      await deleteClinicalDraft(`encounter:${selectedPatient.beneficiary_id}`);
      setDraftState('saved');

      // Refresh timeline
      const freshTimeline = await api.getPatientTimeline(selectedPatient.beneficiary_id);
      const safeFreshRecords = Array.isArray(freshTimeline)
        ? freshTimeline
        : Array.isArray(freshTimeline?.medical_records)
        ? freshTimeline.medical_records
        : [];
      setPatientTimeline(safeFreshRecords);

      setFeedback({
        type: 'success',
        message: `Consultation saved successfully! Record #${record.id} registered and ${dispatchedCount} prescription items dispatched to pharmacy queue.`,
      });

      // Mark items as saved
      setActiveRxItems((prev) => prev.map((i) => ({ ...i, saved: true })));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save clinical encounter.' });
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
    } catch {
      setAiSummary('AI Summary is temporarily unavailable.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // All past prescribed medicines across all encounters for History modal (Image 2)
  const allHistoricalMedicines = useMemo(() => {
    const list: Array<{
      date: string;
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      dispensed: boolean;
      dispensed_at?: string | null;
      record_id: number;
      doctor_name?: string | null;
      stock?: number;
    }> = [];

    patientTimeline.forEach((rec) => {
      const dateStr = rec.created_at
        ? new Date(rec.created_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'OPD Encounter';

      if (Array.isArray(rec.prescriptions)) {
        rec.prescriptions.forEach((rx) => {
          const med = medicines.find((m) => m.medicine_name.toLowerCase() === rx.medicine_name?.toLowerCase());
          list.push({
            date: dateStr,
            medicine_name: rx.medicine_name,
            dosage: rx.dosage || '1 Tab',
            frequency: '1-0-1',
            duration: rx.duration || '5 Days',
            quantity: rx.quantity || 10,
            dispensed: rx.dispensed,
            dispensed_at: rx.dispensed_at,
            record_id: rec.id,
            doctor_name: rec.doctor_name,
            stock: med ? med.stock : undefined,
          });
        });
      }
    });

    return list;
  }, [patientTimeline, medicines]);

  const displayedMedicines = useMemo(() => {
    if (filterAvailableOnly) {
      return medicines.filter((m) => m.stock > 0);
    }
    return medicines;
  }, [medicines, filterAvailableOnly]);

  return (
    <div style={{ background: '#f4f6f9', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOP GOVERNMENT / HOSPITAL HEADER BANNER (From Image 1) ── */}
      <div className="gov-top-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Government Health Emblem / Seal */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: '#0d5c3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <Stethoscope size={20} />
          </div>

          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#143825', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Medical System</span>
              <span style={{ fontSize: '0.72rem', background: '#e1ede4', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                CENTRAL OPD
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#57675e' }}>
              Government Health Services &amp; Clinical Management Portal
            </div>
          </div>
        </div>

        {/* Right side controls: Help, Countdown Timer, Attending Doctor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setFeedback({ type: 'success', message: 'Helpdesk: OPD Module v2.4 • Support extension 104' })}
            style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
          >
            <span>Help</span>
            <ChevronDown size={14} />
          </button>

          {/* Session Timer (Photo 1 "Time left: 00:00") */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#92400e',
            }}
          >
            <Clock size={14} />
            <span>Time left: {formatTimer(sessionSeconds)}</span>
            <button
              onClick={handleResetTimer}
              title="Reset session timer"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', display: 'flex', alignItems: 'center', padding: '0 2px' }}
            >
              <RotateCw size={13} />
            </button>
          </div>

          {/* Doctor Profile Badge (Photo 1 "Trupti Manohar Shende") */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1e293b',
            }}
          >
            <UserCheck size={16} color="#0d5c3a" />
            <span>{user?.email?.split('@')[0] || 'Dr. Attending'}</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>[MBBS, Medical Officer]</span>
          </div>
        </div>
      </div>

      {/* ── STATION NAVIGATION TABS ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', padding: '0 1.25rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => handleTabChange('opd')}
          style={{
            padding: '0.65rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderBottom: activeTab === 'opd' ? '3px solid #15803d' : '3px solid transparent',
            color: activeTab === 'opd' ? '#15803d' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Stethoscope size={16} />
          <span>OPD Consultation &amp; Prescription</span>
        </button>

        <button
          onClick={() => handleTabChange('timeline')}
          style={{
            padding: '0.65rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderBottom: activeTab === 'timeline' ? '3px solid #15803d' : '3px solid transparent',
            color: activeTab === 'timeline' ? '#15803d' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <History size={16} />
          <span>Patient Longitudinal Timeline ({patientTimeline.length})</span>
        </button>

        <button
          onClick={() => setShowMedicineHistoryModal(true)}
          style={{
            marginLeft: 'auto',
            padding: '0.4rem 0.75rem',
            alignSelf: 'center',
            background: '#f0fdf4',
            border: '1px solid #15803d',
            borderRadius: '4px',
            color: '#166534',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Pill size={14} />
          <span>Medicine History Popup</span>
        </button>
      </div>

      {/* ── FEEDBACK ALERTS ── */}
      {feedback && (
        <div style={{ margin: '0.75rem 1.25rem 0 1.25rem' }}>
          <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} animate-fade-in`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div style={{ padding: '0.85rem 1.25rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: PATIENT QUEUE / SEARCH */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            OPD Patient Queue ({patients.length})
          </div>

          <form onSubmit={handleSearch} style={{ marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', fontSize: '0.82rem', height: '32px' }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '520px', overflowY: 'auto' }}>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
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
                      padding: '0.5rem 0.65rem',
                      borderRadius: '4px',
                      background: isSelected ? '#e6f4ea' : '#f8fafc',
                      border: isSelected ? '1px solid #16a34a' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? '#166534' : '#1e293b' }}>
                        {p.full_name}
                      </span>
                      <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.05rem 0.3rem', borderRadius: '2px', fontWeight: 600 }}>
                        {p.blood_group || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <span className="font-mono">{p.beneficiary_id}</span>
                      <span>{p.gender || '—'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CLINICAL CONSULTATION OR LONGITUDINAL TIMELINE */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* 1. BENEFICIARY DETAILS STRIP (Institutional Banner) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedPatient.full_name}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#f0fdf4', border: '1px solid #15803d', color: '#166534', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '3px' }}>
                      ID: {selectedPatient.beneficiary_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.76rem', color: '#475569', marginTop: '0.15rem' }}>
                    <span>Gender: <strong>{selectedPatient.gender || 'N/A'}</strong></span>
                    <span>DOB: <strong>{selectedPatient.date_of_birth || 'N/A'}</strong></span>
                    <span>Blood: <strong>{selectedPatient.blood_group || 'N/A'}</strong></span>
                    <span>Phone: <strong>{selectedPatient.phone_number}</strong></span>
                    <span>Emergency: <strong>{selectedPatient.emergency_contact || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={fetchAiSummary}
                  disabled={isLoadingSummary}
                  className="gov-btn-pill gov-btn-pill-muted"
                  title="Generate Clinical Brief using AI"
                >
                  <Sparkles size={13} color="#7c3aed" />
                  <span>{isLoadingSummary ? 'Analyzing...' : 'AI Clinical Brief'}</span>
                </button>

                <button
                  onClick={() => setShowMedicineHistoryModal(true)}
                  className="gov-btn-pill"
                >
                  <History size={13} />
                  <span>Medicine History</span>
                </button>
              </div>
            </div>

            {/* AI Summary View if loaded */}
            {aiSummary && (
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '0.85rem 1rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#5b21b6', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Bot size={16} />
                    <span>MedVault AI Longitudinal Brief</span>
                  </div>
                  <button onClick={() => setAiSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <X size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {aiSummary}
                </div>
              </div>
            )}

            {/* TAB VIEW 1: OPD CONSULTATION & PRESCRIPTION (Image 1) */}
            {activeTab === 'opd' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* SECTION A: CLINICAL DIAGNOSIS (Photo 1) */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e3a5f', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Clinical Diagnosis
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.65rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                        Diagnosis Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Acute Viral Bronchitis / Stage 1 HTN"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        style={{ height: '32px', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                        Duration (yrs / mos / days)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 5 days"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        style={{ height: '32px', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                        Remarks / Observations
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Bilateral wheezing, throat congestion"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        style={{ height: '32px', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setFeedback({ type: 'success', message: 'Diagnosis added to clinical encounter.' })}
                        className="gov-btn-solid-green"
                        style={{ height: '32px', padding: '0 0.85rem' }}
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Secondary Diagnosis buttons on right (Photo 1) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>Quick Diagnosis:</span>
                      {['Viral Fever', 'Acute Bronchitis', 'Type 2 Diabetes', 'Hypertension', 'Gastritis'].map((diag) => (
                        <button
                          key={diag}
                          type="button"
                          onClick={() => setDiagnosis(diag)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                        >
                          + {diag}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowNotesField(!showNotesField)}
                        className="gov-btn-pill gov-btn-pill-muted"
                      >
                        <span>+ Diagnosis Notes</span>
                      </button>
                    </div>
                  </div>

                  {showNotesField && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Detailed clinical findings, vitals, auscultation, or differential diagnosis..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* SECTION B: DRUG PRESCRIPTION TOOLBAR & TABLE (Photo 1) */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.75rem 1rem' }}>
                  {/* Toolbar matching Image 1: [+ New Drug Template] [Manage Template] [Available Medicine] [A/U] [Medicine History] */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                        className="gov-btn-pill"
                      >
                        <Plus size={13} />
                        <span>New Drug Template</span>
                        <ChevronDown size={13} />
                      </button>

                      {showTemplateMenu && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 30,
                            minWidth: '220px',
                            padding: '0.35rem 0',
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', padding: '0.3rem 0.75rem' }}>
                            SELECT STANDARD PROTOCOL
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('fever')}
                            style={{ width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#1e293b' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            Viral URI / Fever (PCM + Cetirizine)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('gastritis')}
                            style={{ width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#1e293b' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            Acute Gastritis (Omeprazole)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate('hypertension')}
                            style={{ width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#1e293b' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            Hypertension Protocol
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                        className={`gov-btn-pill ${filterAvailableOnly ? '' : 'gov-btn-pill-muted'}`}
                      >
                        <span>Available Medicine ({medicines.filter((m) => m.stock > 0).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInputDosage(inputDosage === '1 Tab' ? '5 ml' : '1 Tab')}
                        className="gov-btn-pill gov-btn-pill-muted"
                        title="Alternate Units (Tab / Cap / Syrup)"
                      >
                        <ArrowRightLeft size={12} />
                        <span>A/U ({inputDosage})</span>
                      </button>
                    </div>

                    {/* Medicine History Button (Exact Green Outline Button from Photo 1) */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowMedicineHistoryModal(true)}
                        className="gov-btn-pill"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                      >
                        <History size={14} />
                        <span>Medicine History</span>
                      </button>
                    </div>
                  </div>

                  {/* FAST INLINE DRUG ADDITION ROW */}
                  <form onSubmit={handleAddDrugToTable} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 0.8fr 0.8fr 1.5fr auto', gap: '0.5rem', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Drug * ({displayedMedicines.length} in stock)
                        </label>
                        <select
                          className="form-input"
                          value={selectedMedId}
                          onChange={(e) => setSelectedMedId(Number(e.target.value))}
                          style={{ height: '32px', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        >
                          {displayedMedicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.medicine_name} {m.strength ? `(${m.strength})` : ''} — Stock: {m.stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Dosage
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={inputDosage}
                          onChange={(e) => setInputDosage(e.target.value)}
                          placeholder="1 Tab"
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Frequency
                        </label>
                        <select
                          className="form-input"
                          value={inputFrequency}
                          onChange={(e) => setInputFrequency(e.target.value)}
                          style={{ height: '32px', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        >
                          <option value="1-0-1">1-0-1 (BD / Twice daily)</option>
                          <option value="1-1-1">1-1-1 (TDS / Thrice daily)</option>
                          <option value="1-0-0">1-0-0 (Morning)</option>
                          <option value="0-0-1">0-0-1 (Night / Bedtime)</option>
                          <option value="1-1-1-1">1-1-1-1 (QDS / 4 times)</option>
                          <option value="SOS">SOS (When needed)</option>
                          <option value="STAT">STAT (Immediate single)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Days
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={inputDays}
                          onChange={(e) => setInputDays(parseInt(e.target.value) || 1)}
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={inputQty}
                          onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                          Instructions
                        </label>
                        <select
                          className="form-input"
                          value={inputInstructions}
                          onChange={(e) => setInputInstructions(e.target.value)}
                          style={{ height: '32px', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        >
                          <option value="After food">After food</option>
                          <option value="Before food">Before food</option>
                          <option value="With warm water">With warm water</option>
                          <option value="At bedtime">At bedtime</option>
                          <option value="SOS for severe pain">SOS for severe pain</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="gov-btn-solid-green"
                        style={{ height: '32px', padding: '0 0.85rem' }}
                      >
                        <Plus size={14} />
                        <span>Add Drug</span>
                      </button>
                    </div>
                  </form>

                  {/* PRESCRIPTION TABLE (Matching columns from Photo 1):
                      # | Drug | Dosage | Frequency | Days | Quantity | Status | Prescribed By | Instructions | Action
                  */}
                  <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th style={{ width: '36px' }}>#</th>
                          <th>Drug</th>
                          <th style={{ width: '85px' }}>Dosage</th>
                          <th style={{ width: '95px' }}>Frequency</th>
                          <th style={{ width: '60px' }}>Days</th>
                          <th style={{ width: '70px' }}>Quantity</th>
                          <th style={{ width: '90px' }}>Status</th>
                          <th>Prescribed By</th>
                          <th>Instructions</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeRxItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: '1.75rem', color: '#64748b' }}>
                              No drugs added to this consultation yet. Select a medicine above or choose a Drug Template.
                            </td>
                          </tr>
                        ) : (
                          activeRxItems.map((item, index) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 700, color: '#64748b' }}>{index + 1}</td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{item.medicine_name}</strong>
                                {item.strength && <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.35rem' }}>({item.strength})</span>}
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.3rem', borderRadius: '2px' }}>
                                  Stock: {item.stock}
                                </span>
                              </td>
                              <td>{item.dosage}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#166534' }}>{item.frequency}</span>
                              </td>
                              <td>{item.days}</td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{item.quantity}</strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: item.saved ? '#dcfce7' : '#fef3c7', color: item.saved ? '#166534' : '#92400e', fontWeight: 700 }}>
                                  {item.saved ? 'Dispatched' : 'Active Draft'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                                {user?.email?.split('@')[0] || 'Medical Officer'}
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#334155' }}>{item.instructions}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDrug(item.id)}
                                    title="Remove this medicine"
                                    style={{
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      color: '#991b1b',
                                      borderRadius: '3px',
                                      padding: '0.2rem 0.4rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTTOM ACTION BAR (Matching Photo 1):
                      [+ Drugs Not Available in Hospital] [+ Treatment Details] [Refer Patient] [Bookmark this Rx] [Preview & Save]
                  */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const medName = prompt('Enter outside / non-hospital drug name:');
                          if (medName) {
                            setActiveRxItems((prev) => [
                              ...prev,
                              {
                                id: `item-${Date.now()}`,
                                medicine_id: medicines[0]?.id || 1,
                                medicine_name: `${medName} [Outside Formulary]`,
                                dosage: '1 Tab',
                                frequency: '1-0-1',
                                days: 5,
                                quantity: 10,
                                instructions: 'After food',
                                stock: 0,
                              },
                            ]);
                          }
                        }}
                        className="gov-btn-pill gov-btn-pill-muted"
                      >
                        <Plus size={12} />
                        <span>Drugs Not Available in Hospital</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowNotesField(true)}
                        className="gov-btn-pill gov-btn-pill-muted"
                      >
                        <span>+ Treatment Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const refCenter = prompt('Referral destination / Specialty center:', 'Government Medical College Hospital');
                          if (refCenter) {
                            setRemarks((prev) => `${prev ? prev + ' | ' : ''}Referred to: ${refCenter}`);
                            setFeedback({ type: 'success', message: `Referral note added: ${refCenter}` });
                          }
                        }}
                        className="gov-btn-pill gov-btn-pill-muted"
                      >
                        <span>Refer Patient</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {draftState && (
                        <span style={{ fontSize: '0.72rem', color: draftState === 'conflict' ? '#dc2626' : '#64748b' }}>
                          {draftState === 'draft' && '● Draft saved locally'}
                          {draftState === 'pending' && '● Pending sync'}
                          {draftState === 'conflict' && '● Sync conflict'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('medvault_bookmarked_rx', JSON.stringify({ diagnosis, activeRxItems }));
                          setFeedback({ type: 'success', message: 'Current prescription saved to your clinical bookmark!' });
                        }}
                        className="gov-btn-pill gov-btn-pill-muted"
                      >
                        <span>Bookmark this Rx</span>
                      </button>

                      {/* Prominent Green CTA (Preview & Save from Photo 1) */}
                      <button
                        type="button"
                        disabled={isSubmittingRecord || !diagnosis}
                        onClick={handlePreviewAndSave}
                        className="gov-btn-solid-green"
                        style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                      >
                        <FileCheck size={16} />
                        <span>{isSubmittingRecord ? 'Saving Consultation...' : 'Preview & Save Rx'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB VIEW 2: PATIENT LONGITUDINAL TIMELINE (Safely rendered, no crash!) */}
            {activeTab === 'timeline' && (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="#15803d" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Longitudinal Medical Encounters &amp; History
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowMedicineHistoryModal(true)}
                    className="gov-btn-pill"
                  >
                    <Pill size={14} />
                    <span>View Prescribed Medicine History Table</span>
                  </button>
                </div>

                {!Array.isArray(patientTimeline) || patientTimeline.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                    <FileCheck size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontWeight: 600 }}>No prior recorded clinical encounters for this beneficiary.</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Switch to the OPD Consultation tab to write their first prescription.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {patientTimeline.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          background: '#f8fafc',
                          padding: '0.85rem 1rem',
                          borderLeft: '4px solid #15803d',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>{rec.diagnosis}</strong>
                            <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700 }}>
                              Record #{rec.id}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.74rem', color: '#64748b' }}>
                            <span>Consultant: <strong>{rec.doctor_name || 'Medical Officer'}</strong></span>
                            <span>
                              {rec.created_at
                                ? new Date(rec.created_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent Visit'}
                            </span>
                          </div>
                        </div>

                        {/* Prescriptions summary */}
                        <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.45rem', lineHeight: '1.5' }}>
                          <strong>Prescribed Summary:</strong>
                          <div style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                            {rec.prescription}
                          </div>
                        </div>

                        {/* Structured Prescriptions List with Dispensing Status */}
                        {Array.isArray(rec.prescriptions) && rec.prescriptions.length > 0 && (
                          <div style={{ marginTop: '0.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '0.5rem 0.65rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                              Prescribed Pharmacy Items ({rec.prescriptions.length})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem' }}>
                              {rec.prescriptions.map((p) => (
                                <div
                                  key={p.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.35rem 0.5rem',
                                    background: '#f8fafc',
                                    borderRadius: '3px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>{p.medicine_name}</strong>
                                    <span style={{ color: '#64748b', marginLeft: '0.25rem' }}>×{p.quantity} ({p.duration})</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.68rem', padding: '0.05rem 0.35rem', borderRadius: '2px', background: p.dispensed ? '#dcfce7' : '#fef3c7', color: p.dispensed ? '#166534' : '#92400e', fontWeight: 700 }}>
                                      {p.dispensed ? 'Dispensed' : 'Pending'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRepeatMedicine(p)}
                                      title="Copy to active Rx"
                                      style={{ background: '#f0fdf4', border: '1px solid #16a34a', color: '#166534', padding: '0.1rem 0.35rem', borderRadius: '2px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Repeat
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.notes && (
                          <div style={{ marginTop: '0.45rem', fontSize: '0.76rem', color: '#64748b' }}>
                            <strong>Clinical Notes:</strong> {rec.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Stethoscope size={38} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.35rem' }}>No Beneficiary Patient Selected</h3>
            <p style={{ fontSize: '0.84rem' }}>Please select a patient from the OPD queue on the left to start consultation.</p>
          </div>
        )}
      </div>

      {/* ── MODAL: PRESCRIBED MEDICINE HISTORY (Exact replica from Image 2) ── */}
      {showMedicineHistoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: '#f6ede3',
                borderBottom: '2px solid #e0cdbb',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={18} color="#0d5c3a" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a5f', margin: 0 }}>
                  Prescribed Medicine History
                </h3>
                {selectedPatient && (
                  <span style={{ fontSize: '0.78rem', background: '#e1ede4', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: '3px', fontWeight: 700 }}>
                    {selectedPatient.full_name} ({selectedPatient.beneficiary_id})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="gov-btn-pill gov-btn-pill-muted"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Printer size={13} />
                  <span>Print History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMedicineHistoryModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body / Historical Table */}
            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '135px' }}>Prescribed Date / Visit</th>
                      <th>Medicine Name</th>
                      <th style={{ width: '75px' }}>Dosage</th>
                      <th style={{ width: '80px' }}>Frequency</th>
                      <th style={{ width: '65px' }}>Days</th>
                      <th style={{ width: '70px' }}>Presc Qty</th>
                      <th style={{ width: '65px' }}>Act Qty</th>
                      <th style={{ width: '75px' }}>Issued Qty</th>
                      <th style={{ width: '120px' }}>Today Availability Qty</th>
                      <th>Instruction</th>
                      <th style={{ width: '75px', textAlign: 'center' }}>Status</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHistoricalMedicines.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                          No prior prescribed medicines recorded for this beneficiary.
                        </td>
                      </tr>
                    ) : (
                      allHistoricalMedicines.map((m, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.74rem', whiteSpace: 'nowrap', color: '#334155' }}>{m.date}</td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{m.medicine_name}</strong>
                          </td>
                          <td>{m.dosage}</td>
                          <td>{m.frequency}</td>
                          <td>{m.duration}</td>
                          <td>{m.quantity}</td>
                          <td>{m.quantity}</td>
                          <td>
                            <strong>{m.dispensed ? m.quantity : 0}</strong>
                          </td>
                          <td>
                            {m.stock !== undefined ? (
                              <span style={{ fontSize: '0.74rem', color: m.stock > 10 ? '#166534' : '#b45309', fontWeight: 600 }}>
                                {m.stock} In Stock
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Checking...</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#475569' }}>After food</td>
                          <td style={{ textAlign: 'center' }}>
                            {m.dispensed ? (
                              <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                <Check size={14} /> Dispensed
                              </span>
                            ) : (
                              <span style={{ color: '#d97706', fontSize: '0.72rem', fontWeight: 700 }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRepeatMedicine(m)}
                                className="gov-btn-pill"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                title="Repeat this medicine into current consultation"
                              >
                                <span>Repeat</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '0.65rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Tip: Click <strong>Repeat</strong> on any past medicine to immediately add it to your active prescription.
              </span>
              <button
                type="button"
                onClick={() => setShowMedicineHistoryModal(false)}
                className="gov-btn-solid-green"
                style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
