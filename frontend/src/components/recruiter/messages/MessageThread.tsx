/**
 * MessageThread Component
 * Displays the conversation thread and message input
 * 
 * @description This component renders the message history for a selected
 * conversation and provides an input for sending new messages.
 */

import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatTime } from './messageUtils';
import { Conversation, Message } from './types';

interface MessageThreadProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  selectedConversation: string;
  conversations: Conversation[];
  isSending?: boolean;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedConversation,
  conversations,
  isSending = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedConversation]);

  if (!selectedConversationData) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <CardHeader className="px-6 pb-0">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback aria-hidden="true">
              {selectedConversationData.participantName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>
              {selectedConversationData.participantName}
            </CardTitle>
            <CardDescription>
              Candidate for position
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <div 
          className="flex-grow p-6 overflow-y-auto h-[400px]"
          role="log"
          aria-label={`Conversation with ${selectedConversationData.participantName}`}
          aria-live="polite"
        >
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message, index) => {
                const isFirstInGroup = index === 0 || messages[index - 1].senderId !== message.senderId;
                const showTimestamp = index === 0 || 
                  new Date(message.timestamp).toDateString() !== 
                  new Date(messages[index - 1].timestamp).toDateString();
                const isRecruiter = message.senderId === 'recruiter';
                
                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <Badge variant="outline" className="bg-background">
                          {formatDate(message.timestamp)}
                        </Badge>
                      </div>
                    )}
                    <div 
                      className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}
                      role="article"
                      aria-label={`Message from ${message.senderName} at ${formatTime(message.timestamp)}`}
                    >
                      <div className={`flex ${isRecruiter ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                        {isFirstInGroup && !isRecruiter && (
                          <Avatar className="mt-1">
                            <AvatarFallback aria-hidden="true">
                              {message.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {isFirstInGroup && !isRecruiter && (
                            <div className="text-sm font-medium mb-1">{message.senderName}</div>
                          )}
                          <div 
                            className={`rounded-lg p-3 ${
                              isRecruiter 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-right">
                            {formatTime(message.timestamp)}
                            {!message.read && !isRecruiter && (
                              <span className="ml-2 text-blue-500" aria-label="Unread message">●</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!isSending) handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input 
              ref={inputRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              aria-label="Message input"
              aria-describedby="send-hint"
            />
            <span id="send-hint" className="sr-only">
              Press Enter to send or click the send button
            </span>
            <Button 
              type="submit"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              aria-label={isSending ? 'Sending message...' : 'Send message'}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </>
  );
};

export default MessageThread;
