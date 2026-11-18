'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Error Container */}
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 sm:p-6 lg:p-8 bg-primary/10 rounded-xl border-2 border-primary/20">
            <AlertCircle className="w-16 h-16 text-primary mx-auto" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-primary mb-4">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Page Not Found
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Oops! We couldn't find the page you're looking for. It might have been moved or deleted, or perhaps you followed a broken link.
          </p>
        </div>

        {/* Additional Info */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">What you can do:</p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>• Check the URL for typos</li>
            <li>• Go back to the previous page</li>
            <li>• Visit the home page</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            variant="outline"
            className="touch-target-min flex items-center gap-2"
          >
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </Button>
          <Button
            asChild
            className="touch-target-min flex items-center gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Home Page
            </Link>
          </Button>
        </div>

        {/* Navigation Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/client/orders"
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              Client Orders
            </Link>
            <Link
              href="/freelancer/available"
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              Freelancer Jobs
            </Link>
            <Link
              href="/manager/orders"
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              Manager Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
