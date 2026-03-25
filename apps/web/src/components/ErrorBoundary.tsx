import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Skull, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Skull className="w-16 h-16 mb-6" style={{ color: 'var(--text-muted)' }} />
          <h1 className="font-heading text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Render Error</h1>
          <p className="text-lg mb-8 font-body" style={{ color: 'var(--text-secondary)' }}>
            This component has been lost to the Shadow Realm.
            <br />
            <span className="text-sm font-ui" style={{ color: 'var(--text-muted)' }}>
              ({this.state.error?.message || 'Component encountered an error'})
            </span>
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Retry Render
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
