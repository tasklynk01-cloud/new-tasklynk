"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, MessageSquare, Search, Users, Briefcase, ChevronRight, ExternalLink, ArrowLeft, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { OrderLink } from '@/components/OrderLink';
import Link from 'next/link';

type Message = {
  id: number;
  senderId: number;
  senderName?: string;
  senderRole?: string;
  receiverId: number;
  jobId: number | null;
  content: string;
  fileUrl: string | null;
  adminApproved: boolean;
  createdAt: string;
};

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
};

export default function AdminMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);
  
  // Pending messages for moderation
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  
  // Conversations for viewing all threads
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  // Auth check
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchPendingMessages();
      fetchConversations();
    }
  }, [loading, user, router]);

  const fetchPendingMessages = async () => {
    try {
      setLoadingPending(true);
      const res = await safeApiFetch('/api/messages?adminApproved=false', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const messagesArray = Array.isArray(data) ? data : (data?.data || []);
        setPendingMessages(Array.isArray(messagesArray) ? messagesArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch pending messages:', error);
      toast.error('Failed to load pending messages');
      setPendingMessages([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const token = localStorage.getItem('auth_token');
      const response = await safeApiFetch('/api/v2/conversations?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchConversationMessages = useCallback(async (conversation: Conversation) => {
    try {
      setLoadingMessages(true);
      
      if (conversation.jobId) {
        const response = await safeApiFetch(`/api/jobs/${conversation.jobId}/messages?userRole=admin&limit=100`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          setConversationMessages(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation);
    }
  }, [selectedConversation, fetchConversationMessages]);

  const handleApprove = async (messageId: number) => {
    try {
      const response = await safeApiFetch(`/api/messages/${messageId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        toast.success('Message approved successfully');
        fetchPendingMessages();
      } else {
        toast.error('Failed to approve message');
      }
    } catch (error) {
      console.error('Failed to approve message:', error);
      toast.error('Failed to approve message');
    }
  };

  const handleReject = async (messageId: number) => {
    try {
      const response = await safeApiFetch(`/api/messages/${messageId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved: false }),
      });

      if (response.ok) {
        toast.success('Message rejected');
        fetchPendingMessages();
      } else {
        toast.error('Failed to reject message');
      }
    } catch (error) {
      console.error('Failed to reject message:', error);
      toast.error('Failed to reject message');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getParticipantInfo = (conv: Conversation) => {
    // For admin, show both participants
    return {
      participant1: {
        id: conv.participant1Id,
        name: conv.participant1Name,
        role: conv.participant1Role,
      },
      participant2: {
        id: conv.participant2Id,
        name: conv.participant2Name,
        role: conv.participant2Role,
      },
    };
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participant1Name.toLowerCase().includes(searchLower) ||
      conv.participant2Name.toLowerCase().includes(searchLower) ||
      conv.jobTitle?.toLowerCase().includes(searchLower) ||
      conv.jobDisplayId?.toLowerCase().includes(searchLower)
    );
  });

  // Separate pending messages by sender role
  const clientPendingMessages = pendingMessages.filter(m => m.senderRole === 'client');
  const freelancerPendingMessages = pendingMessages.filter(m => m.senderRole === 'freelancer');
  const otherPendingMessages = pendingMessages.filter(m => m.senderRole !== 'client' && m.senderRole !== 'freelancer');

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Conversation thread view
  if (selectedConversation) {
    const { participant1, participant2 } = getParticipantInfo(selectedConversation);
    
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
          
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                {getInitials(participant1.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">?</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                {getInitials(participant2.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate text-sm">
              {participant1.name} ? {participant2.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs capitalize">{participant1.role}</Badge>
              <span>?</span>
              <Badge variant="outline" className="text-xs capitalize">{participant2.role}</Badge>
              {selectedConversation.jobDisplayId && (
                <span className="font-mono">{selectedConversation.jobDisplayId}</span>
              )}
            </div>
          </div>
          
          {selectedConversation.jobId && (
            <Link href={`/admin/orders/${selectedConversation.jobId}`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-4 w-4" />
                View Order
              </Button>
            </Link>
          )}
        </div>

        {/* Messages - All messages including unapproved for admin */}
        <ScrollArea className="flex-1 pr-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No messages in this conversation</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {conversationMessages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`p-4 rounded-xl max-w-[85%] ${
                    !message.adminApproved 
                      ? 'bg-yellow-50 border-2 border-yellow-200' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-sm">
                        {message.senderName || `User #${message.senderId}`}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {message.senderRole || 'user'}
                      </Badge>
                      {!message.adminApproved && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.fileUrl && (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline mt-2 block"
                      >
                        View attachment
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </p>
                    
                    {/* Moderation actions for pending messages */}
                    {!message.adminApproved && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(message.id)}
                          className="rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(message.id)}
                          className="rounded-xl"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Main view with tabs
  return (
    <div className="w-full p-4 md:p-6 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Moderate and view all platform messages
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
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="destructive" className="rounded-xl px-3 py-1">
              {pendingMessages.length} pending approval
            </Badge>
            <Badge variant="secondary" className="rounded-xl px-3 py-1">
              {conversations.length} conversations
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Pending vs All Conversations */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-3">
            <Clock className="h-4 w-4" />
            Pending Approval
            {pendingMessages.length > 0 && (
              <Badge variant="destructive" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-3">
            <MessageSquare className="h-4 w-4" />
            All Conversations
          </TabsTrigger>
        </TabsList>

        {/* Pending Messages Tab */}
        <TabsContent value="pending">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Pending Messages */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-blue-600">
                  <Users className="w-5 h-5" />
                  Client Messages
                  {clientPendingMessages.length > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {clientPendingMessages.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Pending messages from clients</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : clientPendingMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No pending client messages</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {clientPendingMessages.map((message) => (
                      <div key={message.id} className="border rounded-xl p-4 bg-blue-50/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-900">
                              {message.senderName || `User #${message.senderId}`}
                            </p>
                            {message.jobId && (
                              <OrderLink orderId={message.jobId} className="rounded-xl bg-card" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <p className="mb-3 text-sm line-clamp-3">{message.content}</p>
                        <div className="flex items-center gap-3">
                          <Button size="sm" onClick={() => handleApprove(message.id)} className="rounded-xl">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(message.id)} className="rounded-xl">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Freelancer Pending Messages */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-green-600">
                  <Users className="w-5 h-5" />
                  Freelancer Messages
                  {freelancerPendingMessages.length > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {freelancerPendingMessages.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Pending messages from freelancers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : freelancerPendingMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No pending freelancer messages</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {freelancerPendingMessages.map((message) => (
                      <div key={message.id} className="border rounded-xl p-4 bg-green-50/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-green-900">
                              {message.senderName || `User #${message.senderId}`}
                            </p>
                            {message.jobId && (
                              <OrderLink orderId={message.jobId} className="rounded-xl bg-card" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <p className="mb-3 text-sm line-clamp-3">{message.content}</p>
                        <div className="flex items-center gap-3">
                          <Button size="sm" onClick={() => handleApprove(message.id)} className="rounded-xl">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(message.id)} className="rounded-xl">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Other pending messages */}
          {otherPendingMessages.length > 0 && (
            <Card className="rounded-xl mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  Other Pending Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherPendingMessages.map((message) => (
                    <div key={message.id} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold">
                          {message.senderName || `User #${message.senderId}`}
                          <Badge variant="outline" className="ml-2 text-xs capitalize">
                            {message.senderRole || 'user'}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      <p className="mb-3 text-sm">{message.content}</p>
                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={() => handleApprove(message.id)} className="rounded-xl">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(message.id)} className="rounded-xl">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Conversations Tab */}
        <TabsContent value="all">
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                All Conversations
              </CardTitle>
              <CardDescription>View all message threads across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>

              {loadingConversations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredConversations.map((conv) => {
                    const { participant1, participant2 } = getParticipantInfo(conv);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full text-left border rounded-xl p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1 shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`text-xs ${participant1.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {getInitials(participant1.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">?</span>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`text-xs ${participant2.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {getInitials(participant2.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="font-medium truncate text-sm">
                                {participant1.name} ? {participant2.name}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-1">
                              <Badge variant="outline" className={`text-xs capitalize ${participant1.role === 'client' ? 'border-blue-200' : 'border-green-200'}`}>
                                {participant1.role}
                              </Badge>
                              <span className="text-xs">?</span>
                              <Badge variant="outline" className={`text-xs capitalize ${participant2.role === 'client' ? 'border-blue-200' : 'border-green-200'}`}>
                                {participant2.role}
                              </Badge>
                              {conv.jobDisplayId && (
                                <Badge variant="secondary" className="text-xs font-mono rounded-lg">
                                  {conv.jobDisplayId}
                                </Badge>
                              )}
                            </div>
                            
                            {conv.lastMessagePreview && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.lastMessagePreview}
                              </p>
                            )}
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
