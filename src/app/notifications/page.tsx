'use client';

import React, { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/auth-context-v2';
import { Bell, Filter, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

/**
 * Notifications Page
 * Full page view of all notifications with Option 3 styling
 */
export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || 0;

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(userId);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return '📋';
      case 'payment':
        return '💰';
      case 'rating':
        return '⭐';
      case 'message':
        return '💬';
      case 'revision':
        return '🔄';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4 md:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Activity &amp; Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs rounded-full">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time alerts for assignments, payments, client messages, and QA reviews
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-8 px-3 rounded-xl border-border text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Mark All Read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAllNotifications()}
              className="h-8 px-3 rounded-xl text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={filterRead === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterRead('all')}
            className={`h-7 px-2.5 text-xs rounded-lg ${filterRead === 'all' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
          >
            All ({notifications.length})
          </Button>
          <Button
            size="sm"
            variant={filterRead === 'unread' ? 'default' : 'ghost'}
            onClick={() => setFilterRead('unread')}
            className={`h-7 px-2.5 text-xs rounded-lg ${filterRead === 'unread' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            size="sm"
            variant={filterRead === 'read' ? 'default' : 'ghost'}
            onClick={() => setFilterRead('read')}
            className={`h-7 px-2.5 text-xs rounded-lg ${filterRead === 'read' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
          >
            Read
          </Button>
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block mx-1" />

        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { type: 'order', label: 'Orders' },
            { type: 'payment', label: 'Payments' },
            { type: 'message', label: 'Messages' },
            { type: 'revision', label: 'Revisions' },
            { type: 'system', label: 'System' },
          ].map(({ type, label }) => (
            <Button
              key={type}
              size="sm"
              variant={filterType === type ? 'secondary' : 'ghost'}
              onClick={() => setFilterType(filterType === type ? null : type)}
              className={`h-7 px-2 text-xs rounded-lg ${filterType === type ? 'font-bold bg-muted text-foreground' : 'text-muted-foreground'}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {loading && filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/70 p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Notifications</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filterType || filterRead !== 'all'
              ? 'No notifications match your current filter settings.'
              : 'You are all caught up! New alerts will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                !notification.read
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-card border-border/70 hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0 pt-0.5">
                  {getNotificationIcon(notification.type)}
                </span>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 capitalize">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/75">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="h-6 px-2 text-[11px] font-bold text-primary hover:bg-primary/10"
                  >
                    Read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNotification(notification.id)}
                  className="h-6 px-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
