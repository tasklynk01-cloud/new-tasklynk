'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FreelancerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Freelancer Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-destructive/10 rounded-xl border-2 border-destructive/20">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Error Info */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an error accessing your freelancer dashboard. Please try again.
          </p>
        </div>

        {/* Error Details (Dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20 text-left text-xs">
            <p className="font-mono text-destructive mb-2 break-words">{error.message}</p>
            {error.digest && <p className="text-muted-foreground">ID: {error.digest}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link href="/freelancer/jobs">
              <Home className="w-4 h-4" />
              Available Jobs
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Need assistance? <Link href="/contact" className="text-primary hover:underline font-medium">Get in touch</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
