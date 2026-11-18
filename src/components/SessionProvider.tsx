"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-resilience';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface SessionInfo {
  id: number;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  sessions: SessionInfo[];
  refreshToken: () => Promise<boolean>;
  logout: (terminateAll?: boolean) => Promise<void>;
  terminateSession: (sessionId: number) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const router = useRouter();

  // Token management
  const getToken = useCallback(() => {
    return localStorage.getItem('bearer_token');
  }, []);

  const setToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem('bearer_token', token);
    } else {
      localStorage.removeItem('bearer_token');
    }
  }, []);

  const getTokenExpiry = useCallback((token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }, []);

  // Session validation
  const validateSession = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;

    try {
      const response = await apiClient.get('/api/v2/auth/session');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return true;
      }
    } catch (error) {
      console.error('Session validation failed:', error);
    }

    return false;
  }, [getToken]);

  // Token refresh
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/v2/auth/refresh');
      
      if (response.success && response.data?.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        
        toast.success('Session refreshed', {
          duration: 2000,
        });
        
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't show toast on refresh failure - let logout handle it
    }

    // Refresh failed - logout (will show appropriate message)
    await logout(false, true); // silent logout
    return false;
  }, [setToken]);

  // Auto refresh logic
  const checkTokenExpiry = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();
    
    // If token expires within threshold, refresh it
    if (timeUntilExpiry > 0 && timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
      console.log('Token expiring soon, refreshing...');
      await refreshToken();
    }
    // If token is already expired, logout
    else if (timeUntilExpiry <= 0) {
      console.log('Token expired, logging out...');
      await logout();
    }
  }, [getToken, getTokenExpiry, refreshToken]);

  // Logout function
  const logout = useCallback(async (terminateAll: boolean = false, silent: boolean = false) => {
    try {
      if (terminateAll) {
        await apiClient.post('/api/v2/auth/logout-all');
      } else {
        await apiClient.post('/api/v2/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear local state regardless of API success
    setToken(null);
    setUser(null);
    setSessions([]);
    
    // Redirect to login
    router.push('/login');
    
    // Only show toast if not silent
    if (!silent) {
      toast.info(terminateAll ? 'All sessions terminated' : 'Logged out successfully');
    }
  }, [setToken, router]);

  // Terminate specific session
  const terminateSession = useCallback(async (sessionId: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/api/v2/auth/sessions/${sessionId}`);
      
      if (response.success) {
        // Refresh sessions list
        await refreshSessions();
        toast.success('Session terminated');
        return true;
      }
    } catch (error) {
      console.error('Session termination failed:', error);
      toast.error('Failed to terminate session');
    }
    
    return false;
  }, []);

  // Refresh sessions list
  const refreshSessions = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v2/auth/sessions');
      
      if (response.success && response.data?.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  }, []);

  // Detect concurrent sessions
  const checkConcurrentSessions = useCallback(async () => {
    await refreshSessions();
    
    const activeSessions = sessions.filter(s => s.isActive);
    if (activeSessions.length > 3) { // Allow up to 3 concurrent sessions
      toast.warning('Multiple active sessions detected', {
        description: 'For security, consider terminating unused sessions',
        duration: 10000,
        action: {
          label: 'View Sessions',
          onClick: () => router.push('/settings?tab=security')
        }
      });
    }
  }, [sessions, router]);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      
      const isValid = await validateSession();
      if (isValid) {
        await refreshSessions();
        await checkConcurrentSessions();
      }
      
      setLoading(false);
    };

    initializeSession();
  }, [validateSession, refreshSessions, checkConcurrentSessions]);

  // Set up periodic token checking
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkTokenExpiry();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, checkTokenExpiry]);

  // Handle visibility change (pause checks when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Tab became visible - check token immediately
        checkTokenExpiry();
        refreshSessions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, checkTokenExpiry, refreshSessions]);

  const value: SessionContextType = {
    user,
    loading,
    sessions,
    refreshToken,
    logout,
    terminateSession,
    refreshSessions
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
