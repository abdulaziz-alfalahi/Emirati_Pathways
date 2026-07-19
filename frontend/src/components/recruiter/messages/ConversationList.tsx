
import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from './messageUtils';
import { Conversation } from './types';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import OnlineIndicator from '@/components/ui/OnlineIndicator';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  searchQuery,
  setSearchQuery,
  onSelectConversation,
  onDeleteConversation
}) => {
  const { isOnline, onlineUsers } = useOnlinePresence();
  console.log('[ConversationList] onlineUsers set:', [...onlineUsers]);
  console.log('[ConversationList] participantIds:', conversations.map(c => c.participantId));
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
          <Search className="absolute start-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="ps-8"
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
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${selectedConversation === conversation.id
                  ? 'bg-secondary'
                  : 'hover:bg-secondary/50'
                  }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {conversation.participantName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineIndicator
                        isOnline={isOnline(conversation.participantId)}
                        size="sm"
                        className="absolute -bottom-0.5 -end-0.5"
                      />
                    </div>
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
                    <div className="flex items-center gap-1">
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="p-1 h-5 min-w-5 flex items-center justify-center rounded-full">
                          {conversation.unreadCount}
                        </Badge>
                      )}

                      {/* Delete Button - Visible on Hover or always visible for accessibility */}
                      <button
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteConversation) onDeleteConversation(conversation.id);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
