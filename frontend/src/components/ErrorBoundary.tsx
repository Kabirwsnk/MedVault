import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by MedVault ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '3rem 1.5rem',
            maxWidth: '650px',
            margin: '3rem auto',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <AlertTriangle size={28} color="#dc2626" />
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>
            Session View Notice
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            The clinical station encountered an unexpected display issue while processing record data. Your active session remains authenticated and intact.
          </p>

          {this.state.error && (
            <div
              style={{
                textAlign: 'left',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                color: '#334155',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
            >
              <RefreshCw size={15} />
              <span>Reload Station</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="btn btn-secondary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
            >
              <Home size={15} />
              <span>Return to Overview</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
