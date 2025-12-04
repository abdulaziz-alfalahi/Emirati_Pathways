
import React from 'react';
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
  onScheduleInterview: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedConversation,
  conversations,
  onScheduleInterview,
}) => {
  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  if (!selectedConversationData) return null;

  return (
    <>
      <CardHeader className="px-6 pb-0 border-b pb-4 mb-4">
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
                Candidate for position
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onScheduleInterview}>
            Schedule Interview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <div className="flex-grow p-6 overflow-y-auto h-[400px]">
          <div className="space-y-6">
            {messages.map((message, index) => {
              const isFirstInGroup = index === 0 || messages[index - 1].senderId !== message.senderId;
              const showTimestamp = index === 0 ||
                new Date(message.timestamp).toDateString() !==
                new Date(messages[index - 1].timestamp).toDateString();

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="bg-background">
                        {formatDate(message.timestamp)}
                      </Badge>
                    </div>
                  )}
                  <div className={`flex ${message.senderId === 'recruiter' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${message.senderId === 'recruiter' ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                      {isFirstInGroup && message.senderId !== 'recruiter' && (
                        <Avatar className="mt-1">
                          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {isFirstInGroup && message.senderId !== 'recruiter' && (
                          <div className="text-sm font-medium mb-1">{message.senderName}</div>
                        )}
                        <div className={`rounded-lg p-3 ${message.senderId === 'recruiter'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
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
    </>
  );
};

export default MessageThread;
