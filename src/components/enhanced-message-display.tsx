"use client";

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';

export type EnhancedMessage = {
  id: number;
  jobId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  isApproved: boolean;
  isDelivered: boolean;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: number | null;
};

interface EnhancedMessageDisplayProps {
  message: EnhancedMessage;
  currentUserId: number;
  showStatus?: boolean;
}

export function EnhancedMessageDisplay({ 
  message, 
  currentUserId, 
  showStatus = true 
}: EnhancedMessageDisplayProps) {
  const isSent = message.senderId === currentUserId;
  const isPending = !message.isApproved || !message.isDelivered;

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isSent ? 'text-right' : 'text-left'}`}>
        {/* Sender Name (for received messages) */}
        {!isSent && (
          <div className="flex items-center gap-3 mb-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {message.senderName}
            </p>
            <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
              {message.senderRole}
            </Badge>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`inline-block px-4 py-2.5 rounded-xl ${
          isSent 
            ? isPending 
              ? 'bg-blue-500/70 text-primary-foreground' // Pending sent message (lighter)
              : 'bg-primary text-primary-foreground'    // Delivered sent message
            : 'bg-green-600 text-primary-foreground'     // Received message
        }`}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.message}
          </div>
        </div>

        {/* Timestamp and Status */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{format(new Date(message.createdAt), 'MMM dd, HH:mm')}</span>
          
          {/* Status Badge (only for sent messages) */}
          {isSent && showStatus && (
            <>
              <span>•</span>
              {isPending ? (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Pending Approval</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Delivered</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: EnhancedMessage[];
  currentUserId: number;
  currentUserRole?: string;
  showStatus?: boolean;
}

export function EnhancedMessageList({ 
  messages, 
  currentUserId,
  currentUserRole = 'client',
  showStatus = true 
}: MessageListProps) {
  const isPrivileged = currentUserRole === 'admin' || currentUserRole === 'manager';

  // Filter messages based on user role
  const visibleMessages = messages.filter(msg => {
    // Privileged users see all messages
    if (isPrivileged) return true;
    
    // Sender sees their own messages (even if pending)
    if (msg.senderId === currentUserId) return true;
    
    // Recipients only see approved and delivered messages
    return msg.isApproved && msg.isDelivered;
  });

  if (visibleMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center py-8">
        <div>
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start a conversation below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {visibleMessages.map((message) => (
        <EnhancedMessageDisplay
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
