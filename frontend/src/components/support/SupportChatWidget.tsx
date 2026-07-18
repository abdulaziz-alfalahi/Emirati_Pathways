/**
 * SupportChatWidget — Floating "Chat with Support" bubble + chat panel.
 *
 * Renders a teal FAB bottom-right that expands into a rich chat panel.
 * Supports EN/AR bilingual, RTL, typing, rating, category pre-selection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupportChat, ChatStatus } from '@/context/SupportChatContext';
import {
  MessageCircle, X, Send, Loader2, Star,
  ChevronDown, Headphones, Zap, Shield, Briefcase,
  GraduationCap, Inbox, Building2, ArrowLeft, Check,
  RotateCcw, MinusCircle
} from 'lucide-react';

/* ── Brand tokens ── */
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  bubble: '#0D9488',
};

const CATEGORIES = [
  { id: 'general', icon: Inbox, en: 'General Inquiry', ar: 'استفسار عام' },
  { id: 'technical', icon: Zap, en: 'Technical Issue', ar: 'مشكلة تقنية' },
  { id: 'account', icon: Shield, en: 'Account & Login', ar: 'الحساب وتسجيل الدخول' },
  { id: 'jobs', icon: Briefcase, en: 'Jobs & Applications', ar: 'الوظائف والطلبات' },
  { id: 'training', icon: GraduationCap, en: 'Training & Certificates', ar: 'التدريب والشهادات' },
  { id: 'employer_admin', icon: Building2, en: 'Employer Services', ar: 'خدمات أصحاب العمل' },
];

const SupportChatWidget: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  const {
    status, messages, agentName, unreadCount, ticketId,
    startChat, sendMessage, endChat, rateChat, resetChat,
    isOpen, setIsOpen,
  } = useSupportChat();

  const [inputText, setInputText] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [phase, setPhase] = useState<'category' | 'chat'>('category');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat becomes active
  useEffect(() => {
    if (status === 'active' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // When status transitions to active, switch to chat phase
  useEffect(() => {
    if (status === 'active' || status === 'waiting') setPhase('chat');
  }, [status]);

  const handleStartChat = () => {
    if (!selectedCat) return;
    const initMsg = inputText.trim();
    startChat(selectedCat, initMsg);
    setInputText('');
    setPhase('chat');
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (phase === 'category' && selectedCat) handleStartChat();
      else if (status === 'active') handleSend();
    }
  };

  const handleRate = (r: number) => {
    setSubmittedRating(r);
    rateChat(r);
  };

  const handleNewChat = () => {
    resetChat();
    setPhase('category');
    setSelectedCat('');
    setInputText('');
    setSubmittedRating(0);
    setHoverRating(0);
  };

  /* ── Render ── */
  if (!isOpen) {
    return (
      <button
        id="support-chat-fab"
        onClick={() => setIsOpen(true)}
        className="fixed z-[9999] shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        style={{
          bottom: '24px',
          [isRTL ? 'left' : 'right']: '24px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryDark})`,
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(13,148,136,0.35)',
        }}
        aria-label="Chat with support"
      >
        <MessageCircle className="h-7 w-7 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
        {/* Pulse ring */}
        {/* Attention pulse is gated behind motion-safe: it ran perpetually on every
            page and ignored prefers-reduced-motion. Users who ask for reduced motion
            now get a static FAB. */}
        <span className="absolute inset-0 rounded-full motion-safe:animate-ping opacity-20" style={{ background: brand.primary }} />
      </button>
    );
  }

  return (
    <div
      className="fixed z-[9999] flex flex-col shadow-2xl transition-all duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        bottom: '24px',
        [isRTL ? 'left' : 'right']: '24px',
        width: minimized ? '320px' : '380px',
        height: minimized ? '56px' : '520px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(13,148,136,0.1)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{
          background: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryDark})`,
          minHeight: '56px',
        }}
        onClick={() => { if (minimized) setMinimized(false); }}
      >
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Headphones className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm leading-tight">
            {status === 'active'
              ? agentName || b('Support Agent', 'وكيل الدعم')
              : b('Chat with Support', 'محادثة مع الدعم')}
          </h3>
          <p className="text-white/70 text-xs truncate">
            {status === 'idle' && b('We\'re here to help', 'نحن هنا للمساعدة')}
            {status === 'waiting' && b('Connecting you to an agent...', 'جارٍ توصيلك بوكيل...')}
            {status === 'active' && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {b('Online', 'متصل')}
              </span>
            )}
            {status === 'ended' && b('Chat ended', 'انتهت المحادثة')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {minimized ? <ChevronDown className="h-4 w-4 text-white rotate-180" /> : <MinusCircle className="h-4 w-4 text-white" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Phase: Category Selection ── */}
          {phase === 'category' && status === 'idle' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700 mb-1">
                {b('How can we help you today?', 'كيف يمكننا مساعدتك اليوم؟')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all text-start ${
                      selectedCat === cat.id
                        ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-slate-50'
                    }`}
                  >
                    <cat.icon className={`h-4 w-4 flex-shrink-0 ${selectedCat === cat.id ? 'text-teal-600' : 'text-slate-400'}`} />
                    {isRTL ? cat.ar : cat.en}
                  </button>
                ))}
              </div>

              {selectedCat && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-500">
                    {b('Describe your issue (optional)', 'صف مشكلتك (اختياري)')}
                  </p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={b('Type your question...', 'اكتب سؤالك...')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleStartChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryDark})` }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {b('Start Chat', 'بدء المحادثة')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Phase: Chat (waiting / active / ended) ── */}
          {phase === 'chat' && (
            <>
              {/* Message area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
                style={{ background: '#f8fafb' }}
              >
                {/* Waiting state */}
                {status === 'waiting' && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                    <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 text-teal-600 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {b('Finding an available agent...', 'جارٍ البحث عن وكيل متاح...')}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {b('Please wait a moment', 'يرجى الانتظار لحظة')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map(msg => {
                  const isSystem = msg.senderId === 'system';
                  const isMine = !msg.isAgent && !isSystem;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {isSystem ? (
                        <div className="max-w-[90%] text-center">
                          {msg.content.includes('ticket #') ? (
                            <div className="bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 text-xs text-teal-800 leading-relaxed">
                              <div className="font-semibold text-teal-700 mb-0.5">📋 {b('Support Ticket Created', 'تم إنشاء تذكرة دعم')}</div>
                              {msg.content}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-teal-600 text-white rounded-br-md'
                              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {!isMine && (
                            <div className="text-[10px] font-semibold text-teal-600 mb-0.5">
                              {msg.senderName}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[9px] mt-1 ${isMine ? 'text-teal-200' : 'text-slate-400'} text-end`}>
                            {new Date(msg.timestamp).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Waiting indicator after initial message sent */}
                {status === 'waiting' && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                        {b('Waiting for an agent...', 'في انتظار الوكيل...')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating (ended state) */}
              {status === 'ended' && (
                <div className="px-4 py-3 bg-white border-t border-slate-100">
                  {/* Ticket tracking banner */}
                  {ticketId && (
                    <div className="mb-3 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-xs font-semibold text-teal-800">
                        📋 {b('Your ticket reference:', 'رقم تذكرتك:')}
                        <span className="text-teal-600 font-bold text-sm ml-1">#{ticketId}</span>
                      </p>
                      <p className="text-[10px] text-teal-600 mt-0.5">
                        {b('Use this number to track your issue', 'استخدم هذا الرقم لمتابعة مشكلتك')}
                      </p>
                    </div>
                  )}
                  {submittedRating === 0 ? (
                    <div className="text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {b('How was your experience?', 'كيف كانت تجربتك؟')}
                      </p>
                      <div className="flex justify-center gap-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(s)}
                            className="transition-transform hover:scale-125"
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                s <= (hoverRating || submittedRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-1.5 mx-auto text-xs text-teal-600 hover:underline mt-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {b('Start new chat', 'بدء محادثة جديدة')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-semibold">
                          {b('Thank you for your feedback!', 'شكرًا لملاحظاتك!')}
                        </span>
                      </div>
                      <button
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-1.5 mx-auto text-xs text-teal-600 hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {b('Start new chat', 'بدء محادثة جديدة')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input (active state only) */}
              {status === 'active' && (
                <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={b('Type a message...', 'اكتب رسالة...')}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 placeholder:text-slate-400 bg-slate-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                    style={{ background: brand.primary }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={endChat}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline px-1 flex-shrink-0"
                    title={b('End chat', 'إنهاء المحادثة')}
                  >
                    {b('End', 'إنهاء')}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SupportChatWidget;
