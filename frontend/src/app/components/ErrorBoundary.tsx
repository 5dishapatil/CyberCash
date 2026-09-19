'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-[#0b1120] text-slate-300 p-6">
          <div className="bg-rose-950/30 border border-rose-500/50 rounded-xl p-8 max-w-lg text-center">
            <div className="flex justify-center mb-4 text-rose-500"><AlertTriangle size={48}/></div>
            <h1 className="text-xl font-bold text-white mb-2">Module Crash Detected</h1>
            <p className="text-slate-400 mb-6 text-sm">A UI module encountered a critical fault. Our automated recovery systems have isolated the process.</p>
            <div className="bg-slate-900 p-4 rounded text-left font-mono text-xs text-rose-400 overflow-auto mb-6">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Attempt Recovery
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
