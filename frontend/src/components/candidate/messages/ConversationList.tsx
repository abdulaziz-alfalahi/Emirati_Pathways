
import React from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from './messageUtils';
import { Conversation } from './types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  searchQuery,
  setSearchQuery,
  onSelectConversation
}) => {
  // Filter conversations by search query
  const filteredConversations = conversations.filter(conversation => 
    conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <CardHeader className="px-4 pb-2">
        <CardTitle>Conversations</CardTitle>
        <CardDescription>Your recent message threads</CardDescription>
        <div className="relative my-2">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="px-2 h-[500px] overflow-y-auto">
        <div className="space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id
                    ? 'bg-secondary'
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {conversation.participantName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {conversation.participantName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {conversation.lastMessage}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-muted-foreground">
                      {formatDate(conversation.lastMessageTime)}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="p-1 h-5 min-w-5 flex items-center justify-center rounded-full">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No conversations found
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
};

export default ConversationList;
