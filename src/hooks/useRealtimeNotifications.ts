"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { toast } from 'sonner';

interface RealtimeNotification {
  type: 'connection' | 'notification' | 'heartbeat';
  id?: number;
  title?: string;
  message?: string;
  notificationType?: string;
  timestamp: string;
  userId?: number;
  isRead?: boolean;
}

interface UseRealtimeNotificationsReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  notifications: RealtimeNotification[];
  clearNotifications: () => void;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const connect = useCallback(async () => {
    if (!user || eventSourceRef.current) return;

    try {
      setConnectionStatus('connecting');
      
      // Get auth token
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        console.warn('No auth token available for SSE connection');
        setConnectionStatus('error');
        return;
      }

      // Create EventSource with auth header (Note: EventSource doesn't support custom headers)
      // In production, consider using WebSocket for better auth support
      const eventSource = new EventSource(`/api/v2/realtime/notifications?token=${encodeURIComponent(token)}`);
      
      eventSource.onopen = () => {
        console.log('✅ Real-time notifications connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeNotification = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // Add to notifications list
            setNotifications(prev => [data, ...prev].slice(0, 50)); // Keep last 50
            
            // Show toast notification
            toast.info(data.title || 'New notification', {
              description: data.message,
              duration: 5000,
            });
          } else if (data.type === 'connection') {
            console.log('📡 SSE connection established:', data.message);
          } else if (data.type === 'heartbeat') {
            // Heartbeat received - connection is alive
            console.debug('💓 SSE heartbeat received');
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Close and cleanup
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt reconnection after delay
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting SSE reconnection...');
            connect();
          }, 5000);
        }
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('Error establishing SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [user?.id]); // Only reconnect if user ID changes, not the entire user object

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionStatus,
    notifications,
    clearNotifications,
  };
}

