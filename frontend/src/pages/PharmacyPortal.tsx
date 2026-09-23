import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Medicine, Prescription, InventoryMovement } from '../types';
import { Pill, CheckCircle2, AlertCircle, RefreshCw, PackagePlus, ArrowDownUp, AlertTriangle, X, Plus } from 'lucide-react';

export const PharmacyPortal: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [criticalMeds, setCriticalMeds] = useState<Medicine[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory' | 'movements'>('queue');
  const [isDispensing, setIsDispensing] = useState<number | null>(null);
  const [restockMedicineId, setRestockMedicineId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    medicine_name: '',
    strength: '',
    dosage_form: 'Tablet',
    manufacturer: '',
    unit: 'Strip of 10',
    stock: 100,
  });
  const [isAddingMed, setIsAddingMed] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [rxData, medData, movData, critData] = await Promise.all([
        api.getPrescriptions().catch(() => []),
        api.getMedicines().catch(() => []),
        api.getInventoryMovements().catch(() => []),
        api.getCriticalStock().catch(() => []),
      ]);
      setPrescriptions(rxData);
      setMedicines(medData);
      setMovements(movData);
      setCriticalMeds(critData);
      setAlertDismissed(false);
    } catch (err: any) {
      console.error('Error fetching pharmacy data:', err);
    }
  };

  const handleDispense = async (prescriptionId: number) => {
    setIsDispensing(prescriptionId);
    setFeedback(null);

    try {
      await api.dispensePrescription(prescriptionId);
      setFeedback({ type: 'success', message: `Prescription #${prescriptionId} dispensed! Stock deducted and movement audited.` });
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Dispensing failed' });
    } finally {
      setIsDispensing(null);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMedicineId) return;

    try {
      await api.restockMedicine(restockMedicineId, restockQty);
      const med = medicines.find((m) => m.id === restockMedicineId);
      setFeedback({ type: 'success', message: `Successfully restocked ${med?.medicine_name ?? `#${restockMedicineId}`} (+${restockQty} units)!` });
      setRestockMedicineId(null);
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Restock failed' });
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMed(true);
    setFeedback(null);

    try {
      await api.addMedicine({
        medicine_name: newMed.medicine_name.trim(),
        strength: newMed.strength.trim() || undefined,
        dosage_form: newMed.dosage_form.trim() || undefined,
        manufacturer: newMed.manufacturer.trim(),
        unit: newMed.unit.trim(),
        stock: Number(newMed.stock),
      });
      setFeedback({ type: 'success', message: `Medicine "${newMed.medicine_name}" added to catalog!` });
      setShowAddModal(false);
      setNewMed({
        medicine_name: '',
        strength: '',
        dosage_form: 'Tablet',
        manufacturer: '',
        unit: 'Strip of 10',
        stock: 100,
      });
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add medicine' });
    } finally {
      setIsAddingMed(false);
    }
  };

  const pendingCount = prescriptions.filter((p) => !p.dispensed).length;

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <Pill size={22} color="var(--accent-secondary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Pharmacy Dispensing &amp; Inventory</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Atomic prescription fulfillment, row-level stock locks, and inventory movements.
            </p>
          </div>
        </div>

        <button onClick={loadAllData} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Critical Stock Alert Banner */}
      {criticalMeds.length > 0 && !alertDismissed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}
          className="animate-fade-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <AlertTriangle size={20} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--accent-danger)', fontSize: '0.9375rem' }}>
                Critical Stock Alert ({criticalMeds.length} items low)
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                {criticalMeds.map((m) => `${m.medicine_name} (${m.stock} left)`).join(' · ')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              Restock Now
            </button>
            <button
              onClick={() => setAlertDismissed(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
              title="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescriptions Pending</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: pendingCount > 0 ? 'var(--accent-warning)' : 'var(--accent-secondary)' }}>
            {pendingCount}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catalog Medicines</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-main)' }}>
            {medicines.length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Stock Items</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: criticalMeds.length > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
            {criticalMeds.length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Movements</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-dim)' }}>
            {movements.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('queue')}
          className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8125rem' }}
        >
          Prescription Queue {pendingCount > 0 && <span className="badge badge-amber" style={{ marginLeft: '0.35rem' }}>{pendingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8125rem' }}
        >
          Medicine Catalog &amp; Stock
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`btn ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8125rem' }}
        >
          Movement Audit Ledger
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? 'var(--accent-secondary)' : 'var(--accent-danger)',
            fontSize: '0.875rem',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Prescriptions Pending Fulfillment</h3>
          {prescriptions.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem 0' }}>No prescriptions in queue.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Rx #</th>
                    <th style={{ padding: '0.75rem' }}>Patient</th>
                    <th style={{ padding: '0.75rem' }}>Medicine</th>
                    <th style={{ padding: '0.75rem' }}>Quantity</th>
                    <th style={{ padding: '0.75rem' }}>Dosage &amp; Duration</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <td style={{ padding: '0.75rem' }} className="font-mono">#{rx.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {rx.patient_name ?? <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Encounter #{rx.medical_record_id}</span>}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {rx.medicine_name ?? <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Medicine #{rx.medicine_id}</span>}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{rx.quantity}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{rx.dosage} · {rx.duration}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {rx.dispensed ? (
                          <span className="badge badge-emerald">Dispensed</span>
                        ) : (
                          <span className="badge badge-amber">Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {!rx.dispensed && (
                          <button
                            onClick={() => handleDispense(rx.id)}
                            disabled={isDispensing === rx.id}
                            className="btn btn-emerald"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            {isDispensing === rx.id ? 'Dispensing...' : 'Dispense Stock'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Medicine Stock Catalog</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                Inventory catalog with dosage strengths and formulation classification.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={15} />
              <span>Add Medicine</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Medicine Name</th>
                  <th style={{ padding: '0.75rem' }}>Strength &amp; Form</th>
                  <th style={{ padding: '0.75rem' }}>Manufacturer</th>
                  <th style={{ padding: '0.75rem' }}>Unit</th>
                  <th style={{ padding: '0.75rem' }}>Current Stock</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const isCritical = med.stock <= 10;
                  const isLow = med.stock <= 20 && !isCritical;
                  return (
                    <tr key={med.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <td style={{ padding: '0.75rem' }} className="font-mono">#{med.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{med.medicine_name}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {med.strength || med.dosage_form ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {med.strength && <span className="badge badge-cyan">{med.strength}</span>}
                            {med.dosage_form && <span className="badge badge-purple">{med.dosage_form}</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{med.manufacturer}</td>
                      <td style={{ padding: '0.75rem' }}>{med.unit}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', marginRight: '0.5rem' }}>{med.stock}</span>
                        {isCritical && <span className="badge badge-rose">CRITICAL</span>}
                        {isLow && <span className="badge badge-amber">LOW</span>}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setRestockMedicineId(med.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <PackagePlus size={14} />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movements Audit Log */}
      {activeTab === 'movements' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownUp size={18} color="var(--accent-primary)" />
            <span>Immutable Stock Movement Ledger</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Movement ID</th>
                  <th style={{ padding: '0.75rem' }}>Medicine</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Quantity Delta</th>
                  <th style={{ padding: '0.75rem' }}>Before &rarr; After</th>
                  <th style={{ padding: '0.75rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => {
                  const med = medicines.find((m) => m.id === mov.medicine_id);
                  const medDisplay = med ? `${med.medicine_name}${med.strength ? ` (${med.strength})` : ''}` : `Medicine #${mov.medicine_id}`;
                  return (
                    <tr key={mov.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <td style={{ padding: '0.75rem' }} className="font-mono">#{mov.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {medDisplay}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${mov.movement_type === 'dispense' ? 'badge-emerald' : mov.movement_type === 'restock' ? 'badge-cyan' : 'badge-amber'}`}>
                          {mov.movement_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: mov.quantity < 0 ? 'var(--accent-danger)' : 'var(--accent-secondary)' }}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {mov.stock_before} &rarr; <strong style={{ color: 'var(--text-main)' }}>{mov.stock_after}</strong>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(mov.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockMedicineId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>
              Restock: {medicines.find((m) => m.id === restockMedicineId)?.medicine_name ?? `#${restockMedicineId}`}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Current stock: <strong>{medicines.find((m) => m.id === restockMedicineId)?.stock ?? '—'}</strong> units
            </p>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label className="form-label">Units to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setRestockMedicineId(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald" style={{ flex: 1 }}>
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Add Medicine to Catalog</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Medicine Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin Trihydrate"
                  className="form-input"
                  value={newMed.medicine_name}
                  onChange={(e) => setNewMed({ ...newMed, medicine_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 10mg/5ml"
                    className="form-input"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Dosage Form</label>
                  <select
                    className="form-input"
                    value={newMed.dosage_form}
                    onChange={(e) => setNewMed({ ...newMed, dosage_form: e.target.value })}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cipla Ltd"
                    className="form-input"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Unit / Packaging *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strip of 10"
                    className="form-input"
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Initial Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  value={newMed.stock}
                  onChange={(e) => setNewMed({ ...newMed, stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMed}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isAddingMed ? 'Adding...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
