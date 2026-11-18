"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { format } from 'date-fns';

export function RealtimeNotificationCenter() {
  const { 
    isConnected, 
    connectionStatus, 
    notifications, 
    clearNotifications 
  } = useRealtimeNotifications();

  const [isExpanded, setIsExpanded] = useState(false);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection failed';
      default:
        return 'Disconnected';
    }
  };

  const getNotificationTypeColor = (type?: string) => {
    switch (type) {
      case 'assignment_received':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assignment_accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'assignment_declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'order_status_change':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'payment_received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant={isExpanded ? "default" : "ghost"}
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-[1.25rem] h-5"
          >
            {notifications.length > 99 ? '99+' : notifications.length}
          </Badge>
        )}
      </Button>

      {/* Expanded Notification Panel */}
      {isExpanded && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 shadow-lg border z-50 bg-background">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-3">
                {getConnectionIcon()}
                <span className="text-xs text-muted-foreground">
                  {getConnectionText()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <CardDescription>
                Real-time updates • {notifications.length} unread
              </CardDescription>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  disabled={notifications.length === 0}
                  className="h-7 px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="h-7 px-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="text-sm">All caught up!</p>
                <p className="text-xs">No new notifications</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div key={`${notification.id}-${index}`} className="border-b last:border-b-0">
                    <div className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="text-sm font-medium line-clamp-1">
                          {notification.title || 'Notification'}
                        </h4>
                        
                        {notification.notificationType && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1 py-0 ${getNotificationTypeColor(notification.notificationType)}`}
                          >
                            {notification.notificationType.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.timestamp), 'MMM dd, HH:mm')}
                        </span>
                        
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
