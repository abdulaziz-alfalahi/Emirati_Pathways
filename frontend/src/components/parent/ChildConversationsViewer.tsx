// Guardian oversight — read-only viewer of a MINOR child's conversations.
// Backed by /api/communication/children/<childId>/conversations[..../messages],
// which only responds for verified parent→child links where the child is a
// minor (403 otherwise). There is no write path here by design.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, AlertCircle, MessageSquare, ChevronLeft, Users } from 'lucide-react';

interface ChildRef {
  id: string;
  name: string;
}

interface ChildConversation {
  id: string;
  title?: string | null;
  participants?: string[];
  participant_names?: Record<string, string>;
  last_message_at?: string | null;
  last_message_content?: string | null;
}

interface ChildMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at?: string;
}

interface ChildConversationsViewerProps {
  /** Optional pre-loaded children ({id: users.id, name}). When omitted the
   *  viewer loads the parent's verified children itself. */
  children?: ChildRef[];
}

const ChildConversationsViewer: React.FC<ChildConversationsViewerProps> = ({ children }) => {
  const { language, isRTL } = useLanguage();
  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  // ── Children (prop or self-fetched from /api/parent/children) ──
  const [fetchedKids, setFetchedKids] = useState<ChildRef[] | null>(children ? [] : null);
  const kids = useMemo<ChildRef[]>(
    () => (children && children.length > 0 ? children : fetchedKids || []),
    [children, fetchedKids],
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // ── Conversations of the selected child ──
  const [conversations, setConversations] = useState<ChildConversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [convsError, setConvsError] = useState<'forbidden' | 'error' | null>(null);

  // ── Messages of the selected conversation ──
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChildMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgsError, setMsgsError] = useState(false);

  // Load the parent's verified children when no usable prop was given.
  useEffect(() => {
    if (children && children.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await restClient.get('/api/parent/children');
        const rows: any[] = resp.data?.children || [];
        const mapped: ChildRef[] = rows
          .filter((r) => r?.child_user_id && r?.verified !== false)
          .map((r) => ({
            id: String(r.child_user_id).trim(),
            name: r.full_name || String(r.child_user_id).trim(),
          }));
        if (!cancelled) setFetchedKids(mapped);
      } catch {
        if (!cancelled) setFetchedKids([]);
      }
    })();
    return () => { cancelled = true; };
  }, [children]);

  // Default to the first child once known.
  useEffect(() => {
    if (!selectedChildId && kids.length > 0) setSelectedChildId(kids[0].id);
  }, [kids, selectedChildId]);

  const loadConversations = useCallback(async (childId: string) => {
    setConvsLoading(true);
    setConvsError(null);
    setConversations([]);
    setSelectedConvId(null);
    setMessages([]);
    try {
      const resp = await restClient.get(`/api/communication/children/${childId}/conversations`);
      setConversations(resp.data?.data?.conversations || []);
    } catch (err: any) {
      setConvsError(err?.response?.status === 403 ? 'forbidden' : 'error');
    } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) loadConversations(selectedChildId);
  }, [selectedChildId, loadConversations]);

  const openConversation = async (convId: string) => {
    if (!selectedChildId) return;
    setSelectedConvId(convId);
    setMsgsLoading(true);
    setMsgsError(false);
    setMessages([]);
    try {
      const resp = await restClient.get(
        `/api/communication/children/${selectedChildId}/conversations/${convId}/messages`,
      );
      setMessages(resp.data?.data?.messages || []);
    } catch {
      setMsgsError(true);
    } finally {
      setMsgsLoading(false);
    }
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleString(language === 'ar' ? 'ar' : 'en', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
  };

  const convLabel = (c: ChildConversation, childId: string) => {
    if (c.title) return c.title;
    const others = (c.participants || [])
      .map((p) => String(p).trim())
      .filter((p) => p !== childId.trim());
    const names = others
      .map((p) => c.participant_names?.[p] || c.participant_names?.[p.trim()])
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : t('Conversation', 'محادثة');
  };

  // Nothing to oversee — render nothing rather than an empty shell.
  if (fetchedKids === null && !(children && children.length > 0)) return null; // still loading children
  if (kids.length === 0) return null;

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || null;
  const childIdTrimmed = (selectedChildId || '').trim();

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            {t("Your children's conversations", 'محادثات أبنائك')}
          </CardTitle>
          <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <Eye className="h-3 w-3" />
            {t('Read-only — guardian view', 'للقراءة فقط — عرض ولي الأمر')}
          </Badge>
        </div>

        {kids.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {kids.map((k) => (
              <Button
                key={k.id}
                size="sm"
                variant={selectedChildId === k.id ? 'default' : 'outline'}
                className={selectedChildId === k.id ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
                onClick={() => setSelectedChildId(k.id)}
              >
                {k.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {convsLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Loading conversations…', 'جارٍ تحميل المحادثات…')}
          </div>
        ) : convsError === 'forbidden' ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              {t('Available for minor children only', 'متاح للأبناء القاصرين فقط')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Adult children's conversations are private.", 'محادثات الأبناء البالغين خاصة.')}
            </p>
          </div>
        ) : convsError === 'error' ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              {t('Could not load conversations.', 'تعذّر تحميل المحادثات.')}
            </p>
            <Button
              variant="outline" size="sm" className="mt-3"
              onClick={() => selectedChildId && loadConversations(selectedChildId)}
            >
              {t('Retry', 'إعادة المحاولة')}
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              {t('No conversations yet', 'لا توجد محادثات بعد')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
            {/* Conversation list */}
            <div className={`space-y-1.5 ${selectedConvId ? 'hidden md:block' : ''}`}>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`w-full text-start rounded-lg border p-2.5 transition-colors ${
                    selectedConvId === c.id
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-border hover:bg-muted/60'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{convLabel(c, childIdTrimmed)}</p>
                  {c.last_message_content && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message_content}</p>
                  )}
                  {c.last_message_at && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(c.last_message_at)}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Thread */}
            <div className="min-h-[180px]">
              {!selectedConvId ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground py-8">
                  {t('Select a conversation to read it', 'اختر محادثة لقراءتها')}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="sm" className="md:hidden px-2"
                      onClick={() => setSelectedConvId(null)}
                    >
                      <ChevronLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Button>
                    <p className="text-sm font-semibold truncate">
                      {selectedConv ? convLabel(selectedConv, childIdTrimmed) : ''}
                    </p>
                  </div>

                  {msgsLoading ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('Loading messages…', 'جارٍ تحميل الرسائل…')}
                    </div>
                  ) : msgsError ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('Could not load messages.', 'تعذّر تحميل الرسائل.')}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => openConversation(selectedConvId)}>
                        {t('Retry', 'إعادة المحاولة')}
                      </Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('No messages in this conversation.', 'لا توجد رسائل في هذه المحادثة.')}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pe-1">
                      {messages.map((m) => {
                        const fromChild = String(m.sender_id || '').trim() === childIdTrimmed;
                        return (
                          <div key={m.id} className={`flex ${fromChild ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                fromChild
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {!fromChild && m.sender_name && (
                                <p className="text-[11px] font-semibold opacity-80 mb-0.5">{m.sender_name}</p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              {m.created_at && (
                                <p className={`text-[10px] mt-1 ${fromChild ? 'text-teal-100' : 'text-muted-foreground'}`}>
                                  {fmtDate(m.created_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChildConversationsViewer;
