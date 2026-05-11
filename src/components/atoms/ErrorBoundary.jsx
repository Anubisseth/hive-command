import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — Catches render errors and shows a tactical-styled fallback
 * Prevents a single broken component from crashing the entire dashboard
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HIVE] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 p-8 rounded-lg"
          style={{
            background: 'rgba(255, 51, 68, 0.06)',
            border: '1px solid rgba(255, 51, 68, 0.25)',
            minHeight: this.props.fullPage ? '60vh' : 120,
          }}
        >
          <AlertTriangle size={24} style={{ color: '#FF3344' }} />
          <p className="font-system text-[11px] font-semibold tracking-wider" style={{ color: '#FF3344' }}>
            SYSTEM ERROR
          </p>
          <p className="font-system text-[9px] max-w-md text-center" style={{ color: 'var(--text-tertiary)' }}>
            {this.state.error?.message || 'An unexpected error occurred in this module.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer mt-2"
            style={{
              background: 'rgba(255, 51, 68, 0.1)',
              border: '1px solid rgba(255, 51, 68, 0.3)',
              color: '#FF3344',
              fontSize: '10px',
              fontFamily: 'var(--font-system)',
            }}
          >
            <RefreshCw size={10} />
            RETRY
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
