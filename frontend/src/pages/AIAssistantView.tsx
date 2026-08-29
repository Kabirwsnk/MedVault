import React, { useState } from 'react';
import { api } from '../api/client';
import { Bot, Sparkles, Send, AlertCircle, Activity } from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [symptomResult, setSymptomResult] = useState<any>(null);
  const [isCheckingSymptoms, setIsCheckingSymptoms] = useState(false);

  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSymptomCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    setIsCheckingSymptoms(true);
    try {
      const result = await api.checkSymptoms(symptomsInput.trim());
      setSymptomResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCheckingSymptoms(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryId.trim() || !chatQuestion.trim()) return;
    setIsChatting(true);
    setChatError(null);
    setChatAnswer(null);

    try {
      const res = await api.chatAI(beneficiaryId.trim(), chatQuestion.trim());
      setChatAnswer(res.answer);
    } catch (err: any) {
      setChatError(err.message || 'Chat query failed. Ensure you have permission to view this beneficiary.');
    } finally {
      setIsChatting(false);
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
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <Bot size={22} color="#a855f7" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>AI Clinical Assistant & Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Fast symptom analysis, medical record context synthesis, and clinical Q&A.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Symptom Checker Tool */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1875rem' }}>Keyword Symptom Analyzer</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Enter presenting patient complaints for triage guidance.
          </p>

          <form onSubmit={handleSymptomCheck}>
            <div className="form-group">
              <label className="form-label">Patient Symptoms</label>
              <textarea
                rows={3}
                required
                className="form-textarea"
                placeholder="e.g. fever, headache, productive cough, shortness of breath"
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isCheckingSymptoms}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.625rem' }}
            >
              <Sparkles size={16} />
              <span>{isCheckingSymptoms ? 'Evaluating...' : 'Analyze Symptoms'}</span>
            </button>
          </form>

          {symptomResult && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.9)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Evaluated Conditions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {symptomResult.possible_conditions.map((cond: string, idx: number) => (
                  <span key={idx} className="badge badge-amber font-mono">
                    {cond}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                <strong>Clinical Advice:</strong> {symptomResult.advice}
              </div>
            </div>
          )}
        </div>

        {/* Patient Context Q&A Chat */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={20} color="#a855f7" />
            <h3 style={{ fontSize: '1.1875rem' }}>Grounded Patient History Q&A</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Ask clinical questions grounded in the patient's longitudinal records.
          </p>

          <form onSubmit={handleChat}>
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
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Question</label>
              <textarea
                rows={3}
                required
                className="form-textarea"
                placeholder="What antibiotics was this patient prescribed previously? Are there any allergy alerts?"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isChatting}
              className="btn btn-emerald"
              style={{ width: '100%', padding: '0.625rem' }}
            >
              <Send size={16} />
              <span>{isChatting ? 'Synthesizing Records...' : 'Query AI Health Engine'}</span>
            </button>
          </form>

          {chatError && (
            <div className="alert alert-error animate-fade-in" style={{ marginTop: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{chatError}</span>
            </div>
          )}

          {chatAnswer && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', marginTop: '1.5rem', border: '1px solid rgba(168, 85, 247, 0.4)', background: 'rgba(30, 27, 75, 0.4)' }}>
              <div style={{ fontSize: '0.8125rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '0.5rem' }}>
                AI Synthesized Response:
              </div>
              <div style={{ fontSize: '0.875rem', color: '#f8fafc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {chatAnswer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
