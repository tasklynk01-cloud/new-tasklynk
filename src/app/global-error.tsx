'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('Global Error Boundary Caught:', error)
    if (error.digest) {
      console.error('Error digest:', error.digest)
    }
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#f4f5fa',
          color: '#2d2d5a'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            padding: '40px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(239, 68, 68, 0.2)'
            }}>
              <span style={{ fontSize: '40px' }}>⚠️</span>
            </div>

            {/* Error Title */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ef4444',
              margin: '0 0 15px 0',
              lineHeight: 1.2
            }}>
              Critical Error
            </h1>

            {/* Error Message */}
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: '0 0 30px 0',
              lineHeight: 1.6
            }}>
              A critical error occurred and we're working to fix it. Our team has been notified of the issue.
            </p>

            {/* Error Details (Dev Only) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                padding: '15px',
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#ef4444',
                  margin: '0 0 8px 0'
                }}>
                  Error Details:
                </p>
                <p style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                  margin: 0,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: '10px'
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '12px 24px',
                  background: '#ff8c42',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ff7a2e')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ff8c42')}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#ff8c42',
                  border: '2px solid #ff8c42',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                Go Home
              </button>
            </div>

            {/* Footer */}
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              margin: 0,
              borderTop: '1px solid #e5e7eb',
              paddingTop: '20px'
            }}>
              Error ID: {error.digest || 'unknown'} | 
              <a href="mailto:support@tasklynk.co.ke" style={{
                color: '#ff8c42',
                textDecoration: 'none',
                marginLeft: '8px'
              }}>
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
