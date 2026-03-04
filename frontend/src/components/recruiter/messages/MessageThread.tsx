
import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, CheckCheck, Send, Paperclip, X, FileText, Image as ImageIcon, Download, AlertCircle, RotateCcw, Loader2, Search as SearchIcon, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatTime } from './messageUtils';
import { Conversation, Message, Attachment } from './types';
import EmptyConversation from './EmptyConversation';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase } from 'lucide-react';

interface MessageThreadProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  selectedConversation: string | null;
  conversations: Conversation[];
  onScheduleInterview?: () => void;
  currentUserId: string;
  isTyping?: boolean;
  typingUserName?: string;
  pendingAttachments?: Attachment[];
  onAttachFiles?: (files: FileList) => void;
  onRemoveAttachment?: (index: number) => void;
  onRetryMessage?: (message: Message) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onBack?: () => void;
}

/** Renders ✓ or ✓✓ based on message status */
const ReadReceipt: React.FC<{ message: Message; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  if (!isCurrentUser) return null;
  const status = message.status || (message.read ? 'read' : 'sent');
  if (status === 'read') {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-400 inline-block ml-1" />;
  }
  return <Check className="h-3.5 w-3.5 text-gray-400 inline-block ml-1" />;
};

/** Renders file attachments inline */
const AttachmentDisplay: React.FC<{ attachments: Attachment[] }> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {attachments.map((att, i) => {
        const isImage = att.mimeType?.startsWith('image/');
        return (
          <div key={i}>
            {isImage ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={att.url}
                  alt={att.filename}
                  className="max-w-[240px] max-h-[180px] rounded-lg object-cover border"
                />
              </a>
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border text-xs hover:bg-white/20 transition-colors"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[160px]">{att.filename}</span>
                <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                <Download className="h-3 w-3 ml-auto" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Highlight matching text inside a string */
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  selectedConversation,
  conversations,
  onScheduleInterview,
  currentUserId,
  isTyping,
  typingUserName,
  pendingAttachments,
  onAttachFiles,
  onRemoveAttachment,
  onRetryMessage,
  hasMore,
  loadingMore,
  onLoadMore,
  onBack,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── In-thread search ──────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [matchIndex, setMatchIndex] = useState(0);

  const matchingIds = React.useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [] as string[];
    const q = searchQuery.toLowerCase();
    return messages
      .filter(m => m.content?.toLowerCase().includes(q))
      .map(m => m.id);
  }, [messages, searchQuery]);

  // Scroll to current match
  useEffect(() => {
    if (matchingIds.length > 0 && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-msg-id="${matchingIds[matchIndex]}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchIndex, matchingIds]);

  const toggleSearch = () => {
    setSearchOpen(prev => !prev);
    setSearchQuery('');
    setMatchIndex(0);
    if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // Auto-scroll to bottom
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Scroll-to-top detection for infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || loadingMore) return;
    if (scrollRef.current.scrollTop < 80) {
      onLoadMore?.();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Determine if we have valid conversation data
  const conversationData = conversations.find(c => c.id === selectedConversation);

  if (!selectedConversation || !conversationData) {
    return (
      <div key="empty-state" className="flex flex-col h-full overflow-hidden">
        <EmptyConversation />
      </div>
    );
  }

  // Use a stable wrapper always

  // Create safe defaults if not found, to preserve component structure
  const participantName = conversationData ? conversationData.participantName : 'Unknown Participant';
  const participantInitial = participantName.charAt(0);

  return (
    <div key="content-state" className="flex flex-col h-full overflow-hidden">
      <CardHeader className="px-6 py-3 border-b flex-shrink-0 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar>
              <AvatarFallback>
                {participantInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {participantName}
              </CardTitle>
              <CardDescription>
                {isTyping ? (
                  <span className="text-blue-500 animate-pulse">typing...</span>
                ) : (
                  conversationData.participantRole || 'Participant'
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSearch}>
              {searchOpen ? <X className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
            </Button>
            {onScheduleInterview && conversationData && (
              <Button variant="outline" size="sm" onClick={onScheduleInterview}>
                Schedule Interview
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible search bar */}
        {searchOpen && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setMatchIndex(0); }}
                placeholder="Search messages…"
                className="w-full h-8 pl-8 pr-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {searchQuery.length >= 2 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <span>{matchingIds.length > 0 ? `${matchIndex + 1}/${matchingIds.length}` : '0 results'}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={matchingIds.length === 0}
                  onClick={() => setMatchIndex(i => (i - 1 + matchingIds.length) % matchingIds.length)}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={matchingIds.length === 0}
                  onClick={() => setMatchIndex(i => (i + 1) % matchingIds.length)}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto" onScroll={handleScroll}>
          {!conversationData ? (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
              <p>Select a valid conversation.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Load more spinner */}
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {hasMore && !loadingMore && messages.length > 0 && (
                <button onClick={onLoadMore} className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
                  Load older messages
                </button>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col justify-center items-center h-full text-muted-foreground opacity-50 space-y-2 translate-y-20">
                  <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Send className="h-6 w-6 text-slate-400" />
                  </div>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((message, index) => {
                const uniqueKey = `${message.id}-${index}`; // Robust key
                const isCurrentUser = message.senderId === currentUserId;
                const isFirstInGroup = index === 0 || messages[index - 1].senderId !== message.senderId;
                const showTimestamp = index === 0 ||
                  new Date(message.timestamp).toDateString() !==
                  new Date(messages[index - 1].timestamp).toDateString();

                return (
                  <div key={uniqueKey} data-msg-id={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <Badge variant="outline" className="bg-background">
                          {formatDate(message.timestamp)}
                        </Badge>
                      </div>
                    )}

                    {/* System Message Rendering */}
                    {message.messageType === 'system' ? (
                      <div className="flex justify-center my-4 w-full">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md w-full text-center shadow-sm">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="p-2 bg-blue-100 text-blue-600 rounded-full">
                              <Users className="h-4 w-4" />
                            </span>
                            <h4 className="font-semibold text-sm">Candidate Discussion Started</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{message.content}</p>

                          {(() => {
                            const safeMetadata = (message.metadata && typeof message.metadata === 'object') ? message.metadata : {};
                            return safeMetadata.candidate_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full bg-white hover:bg-slate-50"
                                onClick={() => navigate(`/candidate-profile/${safeMetadata.candidate_id}`)}
                              >
                                <Briefcase className="h-3 w-3 mr-2" />
                                View Candidate Profile
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      /* Standard User Message Rendering */
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
                              ? `bg-blue-600 text-white rounded-br-none${message._optimistic ? ' opacity-60' : ''}${message._failed ? ' bg-red-500' : ''}`
                              : 'bg-white border rounded-bl-none text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              }`}>
                              <HighlightText text={message.content} query={searchQuery} />
                              {message.attachments && message.attachments.length > 0 && (
                                <AttachmentDisplay attachments={message.attachments} />
                              )}
                            </div>
                            <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-0.5 ${isCurrentUser ? 'justify-end' : ''}`}>
                              {message._optimistic ? (
                                <span className="text-muted-foreground italic">Sending...</span>
                              ) : message._failed ? (
                                <button
                                  onClick={() => onRetryMessage?.(message)}
                                  className="text-red-500 flex items-center gap-1 hover:underline"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Failed · Tap to retry
                                </button>
                              ) : (
                                <>
                                  {formatTime(message.timestamp)}
                                  <ReadReceipt message={message} isCurrentUser={isCurrentUser} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-row gap-2 max-w-[80%]">
                    <Avatar className="mt-1">
                      <AvatarFallback>{(typingUserName || participantName).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-4 py-3 bg-white border rounded-bl-none shadow-sm dark:bg-slate-800">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Attachments Preview */}
        {pendingAttachments && pendingAttachments.length > 0 && (
          <div className="px-4 pt-2 flex gap-2 flex-wrap border-t bg-muted/30">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative group flex items-center gap-1.5 bg-background border rounded-lg px-2 py-1 text-xs">
                {att.mimeType?.startsWith('image/') ? (
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-orange-500" />
                )}
                <span className="truncate max-w-[100px]">{att.filename}</span>
                {onRemoveAttachment && (
                  <button
                    onClick={() => onRemoveAttachment(i)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && onAttachFiles) {
                  onAttachFiles(e.target.files);
                  e.target.value = ''; // Reset
                }
              }}
            />
            {onAttachFiles && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={!conversationData}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
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
              disabled={!conversationData}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && (!pendingAttachments || pendingAttachments.length === 0)) || !conversationData}
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
