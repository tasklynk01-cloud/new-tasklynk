"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ error, errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600">Something went wrong</CardTitle>
              <CardDescription className="text-lg">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Bug className="w-4 h-4" />
                  <AlertDescription className="font-mono text-sm">
                    <div className="font-bold text-orange-800 mb-2">Error Details:</div>
                    <div className="text-orange-700">
                      <div className="mb-1">
                        <strong>Message:</strong> {this.state.error.message}
                      </div>
                      <div className="mb-1">
                        <strong>Stack:</strong>
                      </div>
                      <pre className="text-xs bg-orange-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                      {this.state.errorInfo && (
                        <div className="mt-2">
                          <strong>Component Stack:</strong>
                          <pre className="text-xs bg-orange-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* User Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-3"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-3"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>

                <Button 
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="flex items-center gap-3"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please contact support:</p>
                <div className="mt-2 space-x-4">
                  <a 
                    href="mailto:admn@tasklynk.co.ke" 
                    className="text-primary hover:underline"
                  >
                    admn@tasklynk.co.ke
                  </a>
                  <a 
                    href="tel:+254701066845" 
                    className="text-primary hover:underline"
                  >
                    +254 701 066 845
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithErrorBoundary;
}

// Lightweight error boundary for smaller components
export function SimpleErrorBoundary({ 
  children, 
  fallback = <div className="text-red-500 text-sm">Something went wrong</div> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
