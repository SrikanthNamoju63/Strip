/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // You can also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Call onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {this.props.message || 
                'We apologize for the inconvenience. An unexpected error has occurred.'}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left">
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-medium text-gray-700 cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 text-sm text-red-600 overflow-auto">
                    <p className="font-mono">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
