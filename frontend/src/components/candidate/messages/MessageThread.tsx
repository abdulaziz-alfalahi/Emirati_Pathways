
import React, { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
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
  currentUserId: string; // Added prop
}

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedConversation,
  conversations,
  currentUserId,
}) => {
  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  if (!selectedConversationData) {
    return (
      <div key="empty-state" className="flex flex-col h-full overflow-hidden items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium">No conversation selected</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  // Auto-scroll to bottom
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div key="content-state" className="flex flex-col h-full overflow-hidden">
      <CardHeader className="px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>
                {selectedConversationData.participantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {selectedConversationData.participantName}
              </CardTitle>
              <CardDescription>
                Conversation
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((message, index) => {
              const uniqueKey = `${message.id}-${index}`;
              const isCurrentUser = message.senderId === currentUserId;
              const isFirstInGroup = index === 0 || messages[index - 1].senderId !== message.senderId;
              const showTimestamp = index === 0 ||
                new Date(message.timestamp).toDateString() !==
                new Date(messages[index - 1].timestamp).toDateString();

              return (
                <div key={uniqueKey}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="bg-background">
                        {formatDate(message.timestamp)}
                      </Badge>
                    </div>
                  )}
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                      {isFirstInGroup && !isCurrentUser && (
                        <Avatar className="mt-1">
                          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {isFirstInGroup && !isCurrentUser && (
                          <div className="text-sm font-medium mb-1">{message.senderName}</div>
                        )}
                        <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isCurrentUser
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-white border rounded-bl-none text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default MessageThread;
