"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: number;
  orderId: number;
  senderId: number;
  senderRole: string;
  displaySenderName: string;
  senderRoleDisplay: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  chatSpace: string | null;
  createdAt: string;
}

interface OrderChatProps {
  orderId: number;
  currentUserId: number;
  currentUserRole: string;
  orderClientId?: number;
  orderFreelancerId?: number | null;
}

export function OrderChat({
  orderId,
  currentUserId,
  currentUserRole,
  orderClientId,
  orderFreelancerId,
}: OrderChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client');
  const shouldAutoScrollRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get order detail route based on user role
  const getOrderDetailRoute = () => {
    if (currentUserRole === 'admin') return `/admin/jobs/${orderId}`;
    if (currentUserRole === 'manager') return `/manager/orders/${orderId}`;
    if (currentUserRole === 'client' || currentUserRole === 'account_owner') return `/client/orders/${orderId}`;
    if (currentUserRole === 'freelancer') return `/freelancer/orders/${orderId}`;
    return `/orders/${orderId}`;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    shouldAutoScrollRef.current = false;
  }, [messages]);

  // Fetch messages
  const fetchMessages = async (options: { silent?: boolean; autoScroll?: boolean } = {}) => {
    const { silent = false, autoScroll = false } = options;
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await fetch(
        `/api/v2/orders/${orderId}/chat?role=${currentUserRole}&userId=${currentUserId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        shouldAutoScrollRef.current = autoScroll;
        const fetchedMessages: ChatMessage[] = data.messages || [];
        setMessages(fetchedMessages);

        const unread = fetchedMessages.filter(
          (m: ChatMessage) => !m.isRead && m.senderId !== currentUserId
        );
        setUnreadCount(unread.length);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds: number[]): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v2/orders/${orderId}/chat/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      return true;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return false;
    }
  };

  // Send message
  const handleSend = async () => {
    if (!messageText.trim()) return;

    const messageToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const body: any = { message: messageToSend };
      
      // For admin/manager, include chat space (optional)
      if (currentUserRole === 'admin' || currentUserRole === 'manager') {
        body.chatSpace = activeTab;
        if (activeTab === 'client') {
          body.displaySenderName = 'Support';
          body.displaySenderRole = 'support';
        } else {
          body.displaySenderName = 'Client';
          body.displaySenderRole = 'client';
        }
      }
      // All other users can send messages without restrictions
      // The backend will handle routing automatically

      const response = await fetch(`/api/v2/orders/${orderId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchMessages({ silent: true, autoScroll: true });
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to send message'));
        setMessageText(messageToSend); // Restore message on error
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setMessageText(messageToSend); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [orderId, currentUserId, currentUserRole, activeTab]);

  // Filter messages based on user role and active tab
  // ALL USERS CAN SEE ALL MESSAGES - No restrictions
  const getDisplayMessages = () => {
    if (currentUserRole === 'admin' || currentUserRole === 'manager') {
      // Admin/Manager sees messages filtered by chat space (for tab switching)
      return messages.filter(m => m.chatSpace === activeTab || !m.chatSpace);
    } else {
      // All other users (client, freelancer, account_owner) see all messages
      // Messages are shown immediately like SMS/WhatsApp
      return messages;
    }
  };

  const displayMessages = getDisplayMessages();

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex items-center justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-3">
          <CardTitle>Messages</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount} unread</Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentUserRole === 'admin' || currentUserRole === 'manager' ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'client' | 'freelancer')}>
              <TabsList>
                <TabsTrigger value="client">Client Chat</TabsTrigger>
                <TabsTrigger value="freelancer">Freelancer Chat</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setRefreshing(true);
              await fetchMessages({ silent: true });
              setRefreshing(false);
            }}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              // Mark all unread as read manually without navigating away
              const unreadIds = messages.filter(m => !m.isRead && m.senderId !== currentUserId).map(m => m.id);
              if (unreadIds.length === 0) return;
              setMarkingRead(true);
              const ok = await markAsRead(unreadIds);
              if (ok) {
                // Update local state to reflect read status
                setMessages(prev => prev.map(pm => unreadIds.includes(pm.id) ? { ...pm, isRead: true } : pm));
                setUnreadCount(0);
              }
              setMarkingRead(false);
            }}
          >
            {markingRead ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Read'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {displayMessages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-semibold mb-1 opacity-80">
                          {msg.displaySenderName || msg.senderRoleDisplay}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                          {isOwnMessage && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-4 h-4 inline" />
                              ) : (
                                <Check className="w-4 h-4 inline" />
                              )}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(getOrderDetailRoute());
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Order
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              size="icon"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

