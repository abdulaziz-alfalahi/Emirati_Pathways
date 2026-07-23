/**
 * AiAssistPanel — shared AI assistant card.
 *
 * Backed by POST /api/ai/assist (Qwen). The panel sends only the whitelisted,
 * non-identifying context supplied by the host page; prompts live server-side.
 * On backend unavailability it shows an honest "assistant unavailable" state —
 * it never fabricates insights.
 *
 * Usage:
 *   <AiAssistPanel
 *     feature="training_recommendations"
 *     getContext={() => ({ skills: [...], goal: '...' })}
 *   />
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';

const TEAL = '#006E6D';

export interface AiAssistPanelProps {
  /** Server-side feature key (see backend/routes/ai_assist_routes.py). */
  feature: string;
  /** Builds the context object at click time (only whitelisted keys are used). */
  getContext: () => Record<string, unknown>;
  /** Optional title override. */
  title?: string;
  titleAr?: string;
  className?: string;
}

const AiAssistPanel: React.FC<AiAssistPanelProps> = ({ feature, getContext, title, titleAr, className }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restClient.post('/api/ai/assist', {
        feature,
        language: isRTL ? 'ar' : 'en',
        context: getContext(),
      });
      if (res.data?.success && res.data?.text) {
        setText(res.data.text);
      } else {
        setError(res.data?.message || t('AI assistant is currently unavailable', 'المساعد الذكي غير متاح حالياً'));
      }
    } catch {
      setError(t('AI assistant is currently unavailable', 'المساعد الذكي غير متاح حالياً'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !text && !loading) run();
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={className}
      style={{
        border: `1px solid ${TEAL}30`,
        background: 'linear-gradient(135deg, #f0faf9, #ffffff)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px', background: 'transparent',
          border: 'none', cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 700, color: TEAL }}>
          <Sparkles size={17} color={TEAL} />
          {isRTL ? (titleAr || 'رؤى الذكاء الاصطناعي') : (title || 'AI insights')}
        </span>
        {open ? <ChevronUp size={16} color={TEAL} /> : <ChevronDown size={16} color={TEAL} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5b7573', fontSize: 13, padding: '8px 0' }}>
              <Loader2 size={15} className="animate-spin" />
              {t('Thinking…', 'جارٍ التفكير…')}
            </div>
          )}
          {!loading && error && (
            <div style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>
              {error}
            </div>
          )}
          {!loading && !error && text && (
            <>
              <div style={{ fontSize: 13, color: '#0f2b2a', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{text}</div>
              <button
                onClick={run}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                  background: '#fff', color: TEAL, border: `1px solid ${TEAL}40`,
                  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} /> {t('Regenerate', 'إعادة التوليد')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAssistPanel;
