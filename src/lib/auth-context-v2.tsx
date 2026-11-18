/**
 * Secure Client-Side Authentication Context
 * 
 * Features:
 * - Automatic session refresh
 * - Persistent login state via httpOnly cookies
 * - Graceful error handling
 * - Type-safe user data
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MemoPopup } from '@/components/MemoPopup';

export type UserRole = 'admin' | 'client' | 'freelancer' | 'manager' | 'account_owner' | 'writer' | 'editor';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  status: string;
  // Optional/derived fields used by various dashboards
  clientId?: string;
  tier?: string | null;
  tierColor?: string | null;
  balance?: number;
  rating?: number;
  phone?: string;
  profilePicture?: string | null;
  completedJobs?: number;
  displayId?: string;
  emailVerified?: boolean;
  statusLabel?: string;
  approval?: {
    status: string;
    label: string;
    approved: boolean;
    emailVerified: boolean;
    reason?: string | null;
    blocked?: boolean;
  };
  assignmentCounts?: {
    pendingResponse: number;
    active: number;
    total: number;
  };
  hasPendingAssignments?: boolean;
  clientTier?: string | null;
  clientPriority?: string | null;
  freelancerBadge?: string | null;
  accountName?: string | null;
  presenceStatus?: string | null;
  assignedManagerId?: number | null;
  domainId?: number | null;
  accountId?: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // Backward compatibility for older pages/components
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Check session on mount and periodically refresh
   */
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/auth/session', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          // Bridge: store token in localStorage for legacy components
          if (data.token) {
            localStorage.setItem('bearer_token', data.token);
          }
        } else {
          setUser(null);
          localStorage.removeItem('bearer_token');
        }
      } else {
        setUser(null);
        localStorage.removeItem('bearer_token');
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    checkSession();

    // Refresh session every 15 minutes
    const refreshInterval = setInterval(() => {
      checkSession();
    }, 15 * 60 * 1000);

    // 🟢 Presence heartbeat: Update online status every 2 minutes
    const presenceInterval = setInterval(async () => {
      // Check if user exists at the time of interval execution (not as dependency)
      const currentUser = await fetch('/api/v2/auth/session', { credentials: 'include' })
        .then(res => res.json())
        .then(data => data.user)
        .catch(() => null);
      
      if (currentUser) {
        try {
          await fetch('/api/v2/auth/presence/online', {
            method: 'GET',
            credentials: 'include',
          });
        } catch (error) {
          console.error('[Auth] Presence heartbeat failed:', error);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      clearInterval(refreshInterval);
      clearInterval(presenceInterval);
    };
  }, [checkSession]);

  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await fetch('/api/v2/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.success && data.user) {
      setUser(data.user);
      // Bridge: store token in localStorage for legacy components
      if (data.token) {
        localStorage.setItem('bearer_token', data.token);
      }
      
      // 🟢 Set user presence to online immediately after login
      try {
        await fetch('/api/v2/auth/presence/online', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (presenceError) {
        console.error('[Auth] Failed to set online presence:', presenceError);
      }
    } else {
      throw new Error('Invalid response from server');
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      // 🔴 Set presence to offline BEFORE logging out
      await fetch('/api/v2/auth/presence/offline', {
        method: 'POST',
        credentials: 'include',
      });
      
      await fetch('/api/v2/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('bearer_token');
      router.push('/login');
    }
  }, [router]);

  /**
   * Manually refresh session
   */
  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession, refreshUser: refreshSession }}>
      {children}
      {/* Memo Popup - always rendered to maintain hook order, handles user check internally */}
      <MemoPopup />
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
