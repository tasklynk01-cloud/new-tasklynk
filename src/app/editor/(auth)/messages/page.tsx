"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Send, MessageSquare, AlertCircle, User, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { PresenceIndicator } from "@/components/PresenceIndicator";

interface Message {
  id: number;
  senderId: number;
  senderRole: string;
  senderName: string;
  receiverId: number;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  userId: number;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function EditorMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      // Auto-refresh messages every 10 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch('/api/v2/editor/messages/conversations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const response = await safeApiFetch(`/api/v2/editor/messages/${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await safeApiFetch('/api/v2/editor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedConversation,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage("");
      await fetchMessages(selectedConversation);
      await fetchConversations(); // Refresh conversation list
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.userId === selectedConversation);

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <Card className="w-80 flex-shrink-0 rounded-none border-r border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-5rem)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedConversation(conv.userId)}
                className={`
                  w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left
                  ${selectedConversation === conv.userId ? 'bg-orange-50 border-l-4 border-l-[#ff8c42]' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{conv.userName}</span>
                    <PresenceIndicator userId={conv.userId} size="sm" />
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-[#ff8c42] text-white">{conv.unreadCount}</Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs mb-2">
                  {conv.userRole}
                </Badge>
                <p className="text-sm text-gray-600 line-clamp-2">{conv.lastMessage}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(conv.lastMessageAt), 'MMM dd, h:mm a')}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No Conversation Selected</p>
              <p className="text-sm">Choose a conversation from the left to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConv?.userName}</h2>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{selectedConv?.userRole}</Badge>
                      <PresenceIndicator userId={selectedConversation} size="sm" showLabel />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSent = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          isSent
                            ? 'bg-[#ff8c42] text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {!isSent && (
                          <p className="text-xs font-semibold mb-1 opacity-75">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isSent ? 'text-white/75' : 'text-gray-500'}`}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 resize-none min-h-[60px]"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 bg-[#ff8c42] hover:bg-[#e67a32]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
