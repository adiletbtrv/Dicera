import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

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
        <div className="w-full flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 w-full text-left space-y-3 shadow-lg">
            <div className="flex items-center gap-3">
               <AlertTriangle className="w-6 h-6 text-red-400" />
               <h2 className="text-lg font-bold text-white tracking-tight">Component Encountered an Error</h2>
            </div>
             
            <p className="text-gray-400 text-sm pl-9">
              {this.state.error?.message || 'An unexpected error occurred rendering this section.'}
            </p>
            <div className="pl-9 pt-2">
               <button
                 onClick={() => {
                   this.setState({ hasError: false, error: null });
                 }}
                 className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-95 border border-red-400/30"
               >
                 <RefreshCcw className="w-4 h-4" />
                 Retry Render
               </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
