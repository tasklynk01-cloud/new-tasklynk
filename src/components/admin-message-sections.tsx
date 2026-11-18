"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import OrderLink from '@/components/OrderLink';
import { toast } from 'sonner';
import { useState } from 'react';

export type PendingMessage = {
  id: number;
  jobId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

interface PendingMessagesSectionProps {
  messages: PendingMessage[];
  jobId: number;
  currentJob?: {
    clientId: number;
    assignedFreelancerId: number | null;
  };
  onMessageDelivered?: () => void;
}

export function PendingMessagesSection({
  messages,
  jobId,
  currentJob,
  onMessageDelivered,
}: PendingMessagesSectionProps) {
  const [delivering, setDelivering] = useState<number | null>(null);

  const handleDeliverMessage = async (messageId: number, senderId: number) => {
    setDelivering(messageId);

    try {
      const response = await fetch(`/api/jobs/${jobId}/messages/${messageId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to deliver message');
      }

      toast.success('Message delivered successfully!');
      onMessageDelivered?.();
    } catch (error) {
      console.error('Failed to deliver message:', error);
      toast.error('Failed to deliver message');
    } finally {
      setDelivering(null);
    }
  };

  const getRecipientLabel = (senderId: number) => {
    if (!currentJob) return 'Recipient';
    
    if (senderId === currentJob.clientId) {
      return 'Freelancer';
    } else if (currentJob.assignedFreelancerId && senderId === currentJob.assignedFreelancerId) {
      return 'Client';
    }
    return 'Recipient';
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-4 h-4 text-amber-600" />
        <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
          Pending Delivery ({messages.length})
        </h3>
      </div>
      
      {/* Order quick access link */}
      <div className="mb-2">
        <OrderLink orderId={jobId} className="bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200" title="Open Order">
          View Order #{jobId}
        </OrderLink>
      </div>

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 rounded-lg p-4"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-3 mb-1.5">
                <Badge variant="outline" className="text-xs capitalize">
                  From: {msg.senderRole}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  {msg.senderName}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
            </p>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => handleDeliverMessage(msg.id, msg.senderId)}
            disabled={delivering === msg.id}
            className="mt-2"
          >
            {delivering === msg.id ? (
              <>
                <Clock className="w-4 h-4 mr-1 animate-spin" />
                Delivering...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Deliver to {getRecipientLabel(msg.senderId)}
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

interface DeliveredMessagesSectionProps {
  messages: Array<{
    id: number;
    senderId: number;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
    approvedAt?: string | null;
  }>;
  currentJob?: {
    clientId: number;
    assignedFreelancerId: number | null;
  };
}

export function DeliveredMessagesSection({
  messages,
  currentJob,
}: DeliveredMessagesSectionProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 italic">
        No delivered messages yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
          Delivered Messages ({messages.length})
        </h3>
      </div>
      
      {/* Delivered messages - add non-intrusive order link if context available */}
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-3 mb-1.5">
                <Badge variant="secondary" className="text-xs capitalize">
                  From: {msg.senderRole}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  {msg.senderName}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
              </p>
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="w-4 h-4 mr-1" />
                Delivered
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
