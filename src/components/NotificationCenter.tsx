'use client';

import React, { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';

interface NotificationCenterProps {
  userId: number | null;
  className?: string;
}

/**
 * Notification Center Component
 * Displays notifications with ability to mark as read, delete, and navigate to related content
 */
export function NotificationCenter({
  userId,
  className = '',
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(userId);

  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Get the correct order path based on user role
  const getOrderPath = (orderId: number) => {
    const role = user?.role;
    switch (role) {
      case 'admin':
        return `/admin/orders/${orderId}`;
      case 'manager':
        return `/manager/orders/${orderId}`;
      case 'client':
      case 'account_owner':
        return `/client/orders/${orderId}`;
      case 'freelancer':
        return `/freelancer/jobs/${orderId}`;
      default:
        return `/orders/${orderId}`;
    }
  };

  // Handle notification click - navigate to related content
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and relatedId
    if (notification.relatedId) {
      switch (notification.type) {
        case 'message':
        case 'order':
        case 'revision':
          // Navigate to order details
          router.push(getOrderPath(notification.relatedId));
          setIsOpen(false);
          break;
        case 'payment':
          // Navigate to order or payment details
          if (notification.relatedType === 'job' || notification.relatedType === 'order') {
            router.push(getOrderPath(notification.relatedId));
            setIsOpen(false);
          }
          break;
        default:
          // For other types, just mark as read
          break;
      }
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

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

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'rating':
        return 'bg-yellow-50 border-yellow-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'revision':
        return 'bg-orange-50 border-orange-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Check if notification is clickable (has a navigable destination)
  const isClickable = (notification: Notification) => {
    if (!notification.relatedId) return false;
    return ['message', 'order', 'revision', 'payment'].includes(notification.type);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Count message notifications specifically
  const messageNotificationCount = notifications.filter(n => n.type === 'message' && !n.read).length;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}${messageNotificationCount > 0 ? ` (${messageNotificationCount} messages)` : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              {messageNotificationCount > 0 && (
                <p className="text-xs text-purple-600">💬 {messageNotificationCount} new message{messageNotificationCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-3 px-4 py-2 border-b bg-gray-50">
              <button
                onClick={() => markAllAsRead()}
                className="flex-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
              <button
                onClick={() => deleteAllNotifications()}
                className="flex-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-l-4 transition-colors ${
                      isClickable(notification) ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'border-l-blue-600 bg-opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {isClickable(notification) && (
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </p>
                            {notification.type === 'message' && notification.relatedId && (
                              <span className="text-xs text-purple-600 font-medium">
                                Click to view order
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-4 bg-gray-50 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
