"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, ArrowLeft, Search, Briefcase, Clock, ChevronRight, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type Conversation = {
  id: number;
  jobId: number | null;
  jobTitle: string | null;
  jobDisplayId: string | null;
  participant1Id: number;
  participant2Id: number;
  participant1Name: string;
  participant1Email: string;
  participant1Role: string;
  participant2Name: string;
  participant2Email: string;
  participant2Role: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount?: number;
};

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  adminApproved: boolean;
  createdAt: string;
  senderName?: string;
  receiverName?: string;
  jobId?: number;
  fileUrl?: string;
};

type OrderWithMessages = {
  id: number;
  title: string;
  displayId?: string;
  pending: number;
  delivered: number;
  lastAt?: string;
};

export default function ManagerMessagesPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const authErrorHandledRef = useRef(false);

  const handleAuthExpired = useCallback(async () => {
    if (authErrorHandledRef.current) return;
    authErrorHandledRef.current = true;
    toast.error('Session expired. Please log in again.');
    if (typeof logout === 'function') await logout();
  }, [logout]);
  
  // Conversation threading state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Message sending state
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Unread overview
  const [unreadOverview, setUnreadOverview] = useState<number | null>(null);
  
  // Orders with message indicators (fallback view)
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersWithIndicators, setOrdersWithIndicators] = useState<OrderWithMessages[]>([]);
  const [viewMode, setViewMode] = useState<'conversations' | 'orders'>('conversations');

  // Filter by sender type
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'freelancer'>('all');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchConversations();
        fetchUnreadOverview();
        fetchOrdersWithIndicators();
      }
    }
  }, [user, loading, router]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await safeApiFetch('/api/v2/conversations', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = (await safeReadJson(response)) as { conversations?: Conversation[] } | null;
        setConversations(data?.conversations || []);
      } else {
        if (response.status === 401 || response.status === 403) {
          await handleAuthExpired();
          return;
        }
        setViewMode('orders');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setViewMode('orders');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchConversationMessages = useCallback(async (conversation: Conversation) => {
    try {
      setLoadingMessages(true);
      
      if (conversation.jobId) {
        const response = await safeApiFetch(`/api/jobs/${conversation.jobId}/messages?userRole=manager&limit=100`, {
          cache: 'no-store',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = (await safeReadJson(response)) as Message[] | null;
          if (!Array.isArray(data)) {
            toast.error('Unexpected response while loading messages');
            return;
          }
          setConversationMessages(data);
        } else if (response.status === 401 || response.status === 403) {
          await handleAuthExpired();
        }
      } else {
        const otherId = conversation.participant1Id === user?.id 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        const response = await safeApiFetch(`/api/messages?otherId=${otherId}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = (await safeReadJson(response)) as Message[] | null;
          if (!Array.isArray(data)) {
            toast.error('Unexpected response while loading messages');
            return;
          }
          setConversationMessages(data);
        } else if (response.status === 401 || response.status === 403) {
          await handleAuthExpired();
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id, handleAuthExpired]);

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation);
    }
  }, [selectedConversation, fetchConversationMessages]);

  const fetchUnreadOverview = async () => {
    try {
      if (!user) return;
      const res = await safeApiFetch(
        `/api/notifications/message-counts?userId=${user.id}&role=manager`,
        { cache: 'no-store', credentials: 'include' }
      );
      if (res.ok) {
        const data = (await safeReadJson(res)) as { clientMessages?: number; freelancerMessages?: number } | null;
        const total = (data?.clientMessages ?? 0) + (data?.freelancerMessages ?? 0);
        setUnreadOverview(total);
      } else if (res.status === 401 || res.status === 403) {
        await handleAuthExpired();
      }
    } catch (e) {
      console.error('Failed to fetch unread overview', e);
    }
  };

  const fetchOrdersWithIndicators = async () => {
    try {
      setOrdersLoading(true);
      if (!user) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const jobsRes = await safeApiFetch('/api/v2/orders?limit=50', {
        cache: 'no-store',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!jobsRes.ok) {
        if (jobsRes.status === 401 || jobsRes.status === 403) {
          await handleAuthExpired();
          return;
        }
        setOrdersWithIndicators([]);
        return;
      }
      const jobsData = (await safeReadJson(jobsRes)) as { id: number; title: string; displayId?: string }[] | null;
      if (!Array.isArray(jobsData)) {
        setOrdersWithIndicators([]);
        return;
      }
      const allJobs = (jobsData || []).slice(0, 20);

      const results = await Promise.all(
        allJobs.map(async (job) => {
          const msgsRes = await safeApiFetch(`/api/jobs/${job.id}/messages?userRole=manager&limit=500`, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (!msgsRes.ok) {
            if (msgsRes.status === 401 || msgsRes.status === 403) {
              await handleAuthExpired();
            }
            return { id: job.id, title: job.title, displayId: job.displayId, pending: 0, delivered: 0 };
          }
          const msgs = (await safeReadJson(msgsRes)) as { adminApproved: boolean; createdAt: string }[] | null;
          if (!Array.isArray(msgs)) {
            return { id: job.id, title: job.title, displayId: job.displayId, pending: 0, delivered: 0 };
          }
          const pending = msgs.filter((m) => !m.adminApproved).length;
          const delivered = msgs.filter((m) => m.adminApproved).length;
          const lastAt = msgs.at(-1)?.createdAt;
          return { id: job.id, title: job.title, displayId: job.displayId, pending, delivered, lastAt };
        })
      );

      setOrdersWithIndicators(results);
    } catch (e) {
      console.error('Failed to fetch orders indicators', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    try {
      setSending(true);
      
      const payload: Record<string, unknown> = {
        content: newMessage.trim(),
        senderId: user.id,
      };
      
      if (selectedConversation.jobId) {
        payload.jobId = selectedConversation.jobId;
        
        const response = await safeApiFetch(`/api/jobs/${selectedConversation.jobId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        
        if (response.ok) {
          toast.success('Message sent!');
          setNewMessage('');
          fetchConversationMessages(selectedConversation);
        } else {
          if (response.status === 401 || response.status === 403) {
            await handleAuthExpired();
            return;
          }
          const error = (await safeReadJson(response)) ?? {};
          toast.error(extractErrorMessage(error, 'Failed to send message'));
        }
      } else {
        const otherId = selectedConversation.participant1Id === user.id 
          ? selectedConversation.participant2Id 
          : selectedConversation.participant1Id;
        
        const response = await safeApiFetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            senderId: user.id,
            receiverId: otherId,
            content: newMessage.trim(),
          }),
        });
        
        if (response.ok) {
          toast.success('Message sent!');
          setNewMessage('');
          fetchConversationMessages(selectedConversation);
        } else {
          if (response.status === 401 || response.status === 403) {
            await handleAuthExpired();
            return;
          }
          const error = (await safeReadJson(response)) ?? {};
          toast.error(extractErrorMessage(error, 'Failed to send message'));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    if (conv.participant1Id === user?.id) {
      return {
        id: conv.participant2Id,
        name: conv.participant2Name,
        email: conv.participant2Email,
        role: conv.participant2Role,
      };
    }
    return {
      id: conv.participant1Id,
      name: conv.participant1Name,
      email: conv.participant1Email,
      role: conv.participant1Role,
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    
    // Filter by role
    if (filterRole !== 'all' && other.role !== filterRole) return false;
    
    // Filter by search
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      other.name.toLowerCase().includes(searchLower) ||
      other.email.toLowerCase().includes(searchLower) ||
      conv.jobTitle?.toLowerCase().includes(searchLower) ||
      conv.jobDisplayId?.toLowerCase().includes(searchLower)
    );
  });

  // Separate conversations by role
  const clientConversations = filteredConversations.filter(c => getOtherParticipant(c).role === 'client');
  const freelancerConversations = filteredConversations.filter(c => getOtherParticipant(c).role === 'freelancer');

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Conversation thread view
  if (selectedConversation) {
    const other = getOtherParticipant(selectedConversation);
    
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6">
        {/* Thread Header */}
        <div className="flex items-center gap-4 pb-4 border-b mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className={`${other.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {getInitials(other.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{other.name}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className={`text-xs capitalize ${other.role === 'client' ? 'border-blue-300 text-blue-600' : 'border-green-300 text-green-600'}`}>
                {other.role}
              </Badge>
              {selectedConversation.jobDisplayId && (
                <span className="font-mono text-xs">{selectedConversation.jobDisplayId}</span>
              )}
            </div>
          </div>
          
          {selectedConversation.jobId && (
            <Link href={`/manager/orders/${selectedConversation.jobId}`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-4 w-4" />
                View Order
              </Button>
            </Link>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation below</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-xl max-w-[75%] ${
                      message.senderId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {!message.adminApproved && (
                      <p className={`text-xs mt-2 ${
                        message.senderId === user.id ? 'text-primary-foreground/80' : 'text-amber-700'
                      }`}>
                        Pending approval
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.senderId === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="pt-4 border-t mt-4">
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your message... (requires admin approval)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px] resize-none rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="h-[80px] w-12 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Messages are delivered instantly
          </p>
        </div>
      </div>
    );
  }

  // Main conversation list view
  return (
    <div className="w-full p-4 md:p-6 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Conversations organized by clients and freelancers
        </p>
      </div>

      {/* Overview Card */}
      <Card className="mb-6 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <MessageSquare className="w-5 h-5" />
            Message Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {unreadOverview === null ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : (
              <Badge variant={unreadOverview > 0 ? 'destructive' : 'secondary'} className="rounded-xl px-3 py-1">
                {unreadOverview} pending
              </Badge>
            )}
            <div className="flex gap-3">
              <Button
                variant={viewMode === 'conversations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('conversations')}
                className="rounded-xl"
              >
                Conversations
              </Button>
              <Button
                variant={viewMode === 'orders' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('orders')}
                className="rounded-xl"
              >
                By Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'conversations' ? (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Two-column layout for clients and freelancers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Conversations */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-blue-600">
                  <Users className="w-5 h-5" />
                  Client Messages
                </CardTitle>
                <CardDescription>Conversations with clients</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingConversations ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : clientConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No client conversations</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {clientConversations.map((conv) => {
                      const other = getOtherParticipant(conv);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className="w-full text-left border rounded-xl p-4 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                {getInitials(other.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="font-medium truncate text-sm">{other.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                </span>
                              </div>
                              
                              {conv.jobDisplayId && (
                                <Badge variant="secondary" className="text-xs font-mono rounded-lg mb-1">
                                  {conv.jobDisplayId}
                                </Badge>
                              )}
                              
                              {conv.lastMessagePreview && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conv.lastMessagePreview}
                                </p>
                              )}
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Freelancer Conversations */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-green-600">
                  <Users className="w-5 h-5" />
                  Freelancer Messages
                </CardTitle>
                <CardDescription>Conversations with freelancers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingConversations ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : freelancerConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No freelancer conversations</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {freelancerConversations.map((conv) => {
                      const other = getOtherParticipant(conv);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className="w-full text-left border rounded-xl p-4 hover:bg-green-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                                {getInitials(other.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="font-medium truncate text-sm">{other.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                </span>
                              </div>
                              
                              {conv.jobDisplayId && (
                                <Badge variant="secondary" className="text-xs font-mono rounded-lg mb-1">
                                  {conv.jobDisplayId}
                                </Badge>
                              )}
                              
                              {conv.lastMessagePreview && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conv.lastMessagePreview}
                                </p>
                              )}
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Orders with message indicators */
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Briefcase className="w-5 h-5" />
              Orders with Messages
            </CardTitle>
            <CardDescription>Quick links to order conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : ordersWithIndicators.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders found</p>
            ) : (
              <div className="space-y-2">
                {ordersWithIndicators.map((o) => (
                  <Link key={o.id} href={`/manager/orders/${o.id}`} className="block border rounded-xl p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{o.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {o.displayId && <Badge variant="outline" className="font-mono rounded-xl">{o.displayId}</Badge>}
                          {o.lastAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(o.lastAt), 'MMM dd, HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={o.pending > 0 ? 'destructive' : 'secondary'} className="rounded-xl">
                          {o.pending} pending
                        </Badge>
                        <Badge variant="outline" className="rounded-xl">
                          {o.delivered} delivered
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
