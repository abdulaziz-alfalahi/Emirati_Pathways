/**
 * SupportChatButton — Standalone floating chat entry-point.
 *
 * Drop this component anywhere to render a bottom-right FAB that expands
 * into a glassmorphism chat panel. It wires directly into SupportChatContext.
 *
 * Features:
 *  • Modern glassmorphism floating panel with slide-up animation
 *  • Pulse/glow on unread messages
 *  • Category pre-selection → real-time chat → rating
 *  • Passes page context metadata (user_role, current_route, entity_id)
 *  • EN/AR bilingual, RTL-aware
 *  • Minimizable / closable
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSupportChat, ChatStatus } from '@/context/SupportChatContext';

/* ══════════════════════════════════════════════
   Icons — inline SVG so we have zero external deps
   ══════════════════════════════════════════════ */
const IconChat = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconMinus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconStar = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

/* ══════════════════════════════════════════════
   Categories
   ══════════════════════════════════════════════ */
const CATEGORIES = [
  { id: 'general',   emoji: '📬', en: 'General Inquiry',         ar: 'استفسار عام' },
  { id: 'technical', emoji: '⚡', en: 'Technical Issue',          ar: 'مشكلة تقنية' },
  { id: 'account',   emoji: '🔐', en: 'Account & Login',          ar: 'الحساب وتسجيل الدخول' },
  { id: 'jobs',      emoji: '💼', en: 'Jobs & Applications',      ar: 'الوظائف والطلبات' },
  { id: 'training',  emoji: '🎓', en: 'Training & Certificates',  ar: 'التدريب والشهادات' },
  { id: 'employer_admin',  emoji: '🏢', en: 'Employer Services',        ar: 'خدمات أصحاب العمل' },
];

/* ══════════════════════════════════════════════
   Props
   ══════════════════════════════════════════════ */
interface SupportChatButtonProps {
  /** Optional entity ID to pass as context (e.g. job ID, application ID) */
  entityId?: string;
}

/* ══════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════ */
const SupportChatButton: React.FC<SupportChatButtonProps> = ({ entityId }) => {
  /* ── Detect language ── */
  const isRTL = document.documentElement.dir === 'rtl' ||
    document.documentElement.lang === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  /* ── Context ── */
  const {
    status, messages, agentName, unreadCount, ticketId,
    startChat, sendMessage, endChat, rateChat, resetChat,
    isOpen, setIsOpen,
  } = useSupportChat();

  /* ── Local state ── */
  const [inputText, setInputText] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [phase, setPhase] = useState<'category' | 'chat'>('category');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false); // for slide-up animation

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Auto-scroll on new messages ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input when active ── */
  useEffect(() => {
    if (status === 'active' && inputRef.current) inputRef.current.focus();
  }, [status]);

  /* ── Sync phase with status ── */
  useEffect(() => {
    if (status === 'active' || status === 'waiting') setPhase('chat');
  }, [status]);

  /* ── Mount animation ── */
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  /* ── User role from localStorage ── */
  const getUserRole = useCallback((): string => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role || u.user_type || '';
    } catch { return ''; }
  }, []);

  /* ── Handlers ── */
  const handleStartChat = () => {
    if (!selectedCat) return;
    const msg = inputText.trim();
    startChat(selectedCat, msg, {
      user_role: getUserRole(),
      current_route: window.location.pathname,
      entity_id: entityId || '',
    });
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

  /* ══════════════════════════════════════════
     CSS keyframes (injected once)
     ══════════════════════════════════════════ */
  useEffect(() => {
    const id = '__support-chat-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes support-fab-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(13,148,136,0.45); }
        50% { box-shadow: 0 0 0 14px rgba(13,148,136,0); }
      }
      @keyframes support-fab-glow {
        0%, 100% { box-shadow: 0 4px 24px rgba(13,148,136,0.35); }
        50% { box-shadow: 0 4px 32px rgba(239,68,68,0.5), 0 0 12px rgba(239,68,68,0.3); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes support-slide-up {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0)   scale(1); }
      }
      @keyframes support-slide-down {
        from { opacity: 1; transform: translateY(0)   scale(1); }
        to   { opacity: 0; transform: translateY(20px) scale(0.96); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* ══════════════════════════════════════════
     Floating Action Button (closed state)
     ══════════════════════════════════════════ */
  if (!isOpen) {
    const hasUnread = unreadCount > 0;
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t('Chat with support', 'محادثة مع الدعم')}
        style={{
          position: 'fixed',
          bottom: '24px',
          [isRTL ? 'left' : 'right']: '24px',
          zIndex: 9999,
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0D9488, #0F766E)',
          color: '#fff',
          transition: 'transform 0.2s ease',
          animation: hasUnread
            ? 'support-fab-glow 1.5s ease-in-out infinite'
            : 'support-fab-pulse 2.5s ease-in-out infinite',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <IconChat />
        {hasUnread && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 700,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  /* ══════════════════════════════════════════
     Chat Panel (open state)
     ══════════════════════════════════════════ */
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        bottom: '24px',
        [isRTL ? 'left' : 'right']: '24px',
        zIndex: 9999,
        width: minimized ? '320px' : '390px',
        height: minimized ? '56px' : '540px',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        /* Glassmorphism */
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(13,148,136,0.08)',
        /* Animation */
        animation: mounted ? 'support-slide-up 0.3s ease-out forwards' : undefined,
        transition: 'width 0.3s ease, height 0.3s ease',
      }}
    >
      {/* ── Header ── */}
      <div
        onClick={() => { if (minimized) setMinimized(false); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #0D9488, #0F766E)',
          minHeight: '56px',
          cursor: minimized ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '18px' }}>🎧</span>
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>
            {status === 'active'
              ? agentName || t('Support Agent', 'وكيل الدعم')
              : t('Chat with Support', 'محادثة مع الدعم')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.3 }}>
            {status === 'idle' && t("We're here to help", 'نحن هنا للمساعدة')}
            {status === 'waiting' && t('Connecting you to an agent...', 'جارٍ توصيلك بوكيل...')}
            {status === 'active' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#4ade80', display: 'inline-block',
                  animation: 'support-fab-pulse 2s ease infinite',
                }} />
                {t('Online', 'متصل')}
              </span>
            )}
            {status === 'ended' && t('Chat ended', 'انتهت المحادثة')}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
            style={{
              width: '28px', height: '28px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
            aria-label={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? <IconChevronUp /> : <IconMinus />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{
              width: '28px', height: '28px', borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>
      </div>

      {/* ── Body (hidden when minimized) ── */}
      {!minimized && (
        <>
          {/* ── Category Selection Phase ── */}
          {phase === 'category' && status === 'idle' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>
                {t('How can we help you today?', 'كيف يمكننا مساعدتك اليوم؟')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '12px 10px', borderRadius: '12px',
                      border: selectedCat === cat.id ? '2px solid #0D9488' : '1px solid #e2e8f0',
                      background: selectedCat === cat.id ? 'rgba(13,148,136,0.06)' : '#fff',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      color: selectedCat === cat.id ? '#0F766E' : '#475569',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{cat.emoji}</span>
                    {isRTL ? cat.ar : cat.en}
                  </button>
                ))}
              </div>

              {selectedCat && (
                <div style={{ marginTop: '14px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                    {t('Describe your issue (optional)', 'صف مشكلتك (اختياري)')}
                  </p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('Type your question...', 'اكتب سؤالك...')}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '12px',
                      border: '1px solid #e2e8f0', fontSize: '13px',
                      outline: 'none', boxSizing: 'border-box',
                      marginBottom: '10px',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={handleStartChat}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '12px',
                      border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                      color: '#fff', fontSize: '13px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    💬 {t('Start Chat', 'بدء المحادثة')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Chat Phase ── */}
          {phase === 'chat' && (
            <>
              {/* Messages area */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1, overflowY: 'auto', padding: '12px 16px',
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}
              >
                {/* Waiting placeholder */}
                {status === 'waiting' && messages.length === 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flex: 1, textAlign: 'center', gap: '12px',
                    padding: '32px 0',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'rgba(13,148,136,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconLoader />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {t('Finding an available agent...', 'جارٍ البحث عن وكيل متاح...')}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {t('Please wait a moment', 'يرجى الانتظار لحظة')}
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
                      style={{
                        display: 'flex',
                        justifyContent: isSystem ? 'center' : isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {isSystem ? (
                        <span style={{
                          fontSize: '10px', color: '#94a3b8',
                          background: '#f1f5f9', padding: '4px 12px',
                          borderRadius: '999px',
                        }}>
                          {msg.content}
                        </span>
                      ) : (
                        <div style={{
                          maxWidth: '80%', padding: '10px 14px',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine
                            ? 'linear-gradient(135deg, #0D9488, #0F766E)'
                            : '#fff',
                          color: isMine ? '#fff' : '#334155',
                          fontSize: '13px', lineHeight: 1.5,
                          boxShadow: isMine ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                          border: isMine ? 'none' : '1px solid #e2e8f0',
                        }}>
                          {!isMine && (
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#0D9488', marginBottom: '2px' }}>
                              {msg.senderName}
                            </div>
                          )}
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                          <div style={{
                            fontSize: '9px', marginTop: '4px',
                            color: isMine ? 'rgba(255,255,255,0.6)' : '#94a3b8',
                            textAlign: 'end',
                          }}>
                            {new Date(msg.timestamp).toLocaleTimeString(isRTL ? 'ar-AE' : 'en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing indicator while waiting */}
                {status === 'waiting' && messages.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '12px', color: '#64748b',
                    }}>
                      <span style={{ color: '#0D9488' }}><IconLoader /></span>
                      {t('Waiting for an agent...', 'في انتظار الوكيل...')}
                    </div>
                  </div>
                )}
              </div>

              {/* Rating (ended state) */}
              {status === 'ended' && (
                <div style={{
                  padding: '14px 16px', background: '#fff',
                  borderTop: '1px solid #f1f5f9',
                }}>
                  {/* Ticket banner */}
                  {ticketId && (
                    <div style={{
                      marginBottom: '12px', background: 'rgba(13,148,136,0.06)',
                      border: '1px solid rgba(13,148,136,0.15)',
                      borderRadius: '12px', padding: '10px 14px', textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F766E' }}>
                        📋 {t('Your ticket reference:', 'رقم تذكرتك:')}
                        <span style={{ fontWeight: 700, fontSize: '14px', marginLeft: '4px' }}>#{ticketId}</span>
                      </p>
                      <p style={{ fontSize: '10px', color: '#0D9488', marginTop: '2px' }}>
                        {t('Use this number to track your issue', 'استخدم هذا الرقم لمتابعة مشكلتك')}
                      </p>
                    </div>
                  )}
                  {submittedRating === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                        {t('How was your experience?', 'كيف كانت تجربتك؟')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(s)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '2px', transition: 'transform 0.15s',
                              transform: (hoverRating >= s) ? 'scale(1.2)' : 'scale(1)',
                            }}
                          >
                            <IconStar filled={s <= (hoverRating || submittedRating)} />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleNewChat}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '11px', color: '#0D9488',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <IconRefresh /> {t('Start new chat', 'بدء محادثة جديدة')}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', marginBottom: '8px' }}>
                        ✓ {t('Thank you for your feedback!', 'شكرًا لملاحظاتك!')}
                      </p>
                      <button
                        onClick={handleNewChat}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '11px', color: '#0D9488',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <IconRefresh /> {t('Start new chat', 'بدء محادثة جديدة')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input bar (active state only) */}
              {status === 'active' && (
                <div style={{
                  padding: '10px 12px', background: '#fff',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('Type a message...', 'اكتب رسالة...')}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: '12px',
                      border: '1px solid #e2e8f0', fontSize: '13px',
                      outline: 'none', background: '#f8fafc',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    style={{
                      width: '36px', height: '36px', borderRadius: '12px',
                      border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
                      background: inputText.trim() ? 'linear-gradient(135deg, #0D9488, #0F766E)' : '#e2e8f0',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s, transform 0.1s',
                      flexShrink: 0,
                    }}
                  >
                    <IconSend />
                  </button>
                  <button
                    onClick={endChat}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '11px', color: '#ef4444', flexShrink: 0,
                      padding: '4px',
                    }}
                    title={t('End chat', 'إنهاء المحادثة')}
                  >
                    {t('End', 'إنهاء')}
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

export default SupportChatButton;
