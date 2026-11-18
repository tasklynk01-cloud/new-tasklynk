'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for monitoring/debugging
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Error Container */}
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 sm:p-6 lg:p-8 bg-destructive/10 rounded-xl border-2 border-destructive/20">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
            Oops!
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-destructive mb-3">
            Something Went Wrong
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            An unexpected error occurred while processing your request. Our team has been notified and is working to fix the issue.
          </p>
        </div>

        {/* Error Details */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20 text-left">
            <p className="text-xs font-mono text-destructive mb-2 font-semibold">Error Details:</p>
            <p className="text-xs font-mono text-muted-foreground break-words bg-background p-2 rounded border border-border">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: <code className="font-mono">{error.digest}</code>
              </p>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">What you can try:</p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>• Refresh the page to try again</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Try again in a few moments</li>
            <li>• Contact support if the problem continues</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="touch-target-min flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="touch-target-min flex items-center gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Home Page
            </Link>
          </Button>
        </div>

        {/* Support Section */}
        <div className="pt-8 border-t border-border space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Need Help?</p>
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant="ghost"
                className="justify-center touch-target-min text-primary hover:bg-primary/10"
              >
                <a href="mailto:support@tasklynk.co.ke" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </Button>
              <Link
                href="/contact"
                className="text-sm text-primary hover:underline font-medium"
              >
                Send a message →
              </Link>
            </div>
          </div>
        </div>

        {/* Error Reporting */}
        <p className="text-xs text-muted-foreground pt-4">
          Error ID: {error.digest || 'unknown'}
        </p>
      </div>
    </div>
  )
}
