
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { ChevronLeft, ChevronRight, Home, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Brand tokens (EHRDC teal, Google Stitch aesthetic)
const brand = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySurface: '#F0FDFA',
  bg: '#FAFBFC',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};

export interface StatItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export interface EducationPathwayLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: StatItem[];
  tabs: TabItem[];
  defaultTab: string;
  actionButtonText?: string;
  actionButtonHref?: string;
  onActionClick?: () => void;
  academicYear?: string;
}

/* ── Helper: derive breadcrumb label from route path ── */
function routeToLabel(path: string): string {
  return path
    .replace(/^\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export const EducationPathwayLayout: React.FC<EducationPathwayLayoutProps> = ({
  title,
  description,
  icon,
  stats,
  tabs,
  defaultTab,
  actionButtonText,
  actionButtonHref,
  onActionClick,
  academicYear
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [tabFade, setTabFade] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  /* Tab transition: brief fade-in on tab change */
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setTabFade(false);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabFade(true);
    }, 120);
  };

  /* Scroll active tab into view on mobile */
  useEffect(() => {
    if (tabBarRef.current) {
      const activeBtn = tabBarRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  /* Search: filter cards inside the active tab panel by text content */
  useEffect(() => {
    if (!contentRef.current) return;
    const panel = contentRef.current.querySelector(`[data-active-panel="true"]`);
    if (!panel) return;
    const cards = panel.querySelectorAll('.ep-card, [class*="ep-card"]') as NodeListOf<HTMLElement>;
    if (cards.length === 0) return;
    const q = searchQuery.toLowerCase().trim();
    cards.forEach(card => {
      if (!q) {
        card.style.display = '';
        card.style.opacity = '1';
        return;
      }
      const text = card.textContent?.toLowerCase() || '';
      const match = text.includes(q);
      card.style.display = match ? '' : 'none';
      card.style.opacity = match ? '1' : '0';
    });
  }, [searchQuery, activeTab]);

  /* Event delegation: intercept content button clicks and show toast */
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button') as HTMLButtonElement | null;
    if (!btn) return;
    // Ignore tab-bar buttons (they have role="tab")
    if (btn.getAttribute('role') === 'tab') return;
    // If button already has a custom onClick that does something meaningful, skip
    // We detect this by checking if button has data-has-handler attribute
    if (btn.dataset.hasHandler) return;

    const label = btn.textContent?.trim() || 'Action';
    toast.success(`${label} — Coming soon! This feature is under development.`, {
      duration: 3000,
      style: {
        borderRadius: 10,
        background: '#fff',
        color: brand.textPrimary,
        fontSize: 13,
        border: `1px solid ${brand.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,.08)',
      },
      iconTheme: { primary: brand.primary, secondary: '#fff' },
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Same header as home page */}
      <HybridGovernmentNavFixed
        onLanguageToggle={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
        currentLanguage={i18n.language as 'en' | 'ar'}
      />

      <main className="flex-1" style={{ background: brand.bg }}>

        {/* ── Breadcrumb Navigation ── */}
        <nav style={{ background: '#fff', borderBottom: `1px solid ${brand.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: 4, color: brand.primary,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'opacity .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Home size={14} />
              {t('breadcrumb_home', 'Home')}
            </Link>
            {isRTL ? <ChevronLeft size={12} style={{ color: brand.textTertiary }} /> : <ChevronRight size={12} style={{ color: brand.textTertiary }} />}
            <span style={{ fontSize: 13, color: brand.textSecondary, fontWeight: 500 }}>
              {title || routeToLabel(location.pathname)}
            </span>
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <section style={{ background: '#fff', borderBottom: `1px solid ${brand.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* Accent bar */}
              <div style={{ width: 4, height: 48, background: brand.primary, borderRadius: 2, flexShrink: 0, marginTop: 4 }} />
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 600, color: brand.textPrimary, margin: 0, lineHeight: 1.25 }}>
                  {title}
                </h1>
                <p style={{ fontSize: 16, color: brand.textSecondary, marginTop: 12, maxWidth: 600, lineHeight: 1.6 }}>
                  {description}
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {actionButtonText && (
                    onActionClick ? (
                      <button
                        onClick={onActionClick}
                        style={{
                          padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff', border: 'none',
                          cursor: 'pointer', transition: 'background 150ms'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                        onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                      >
                        {actionButtonText}
                      </button>
                    ) : actionButtonHref ? (
                      <a href={actionButtonHref} style={{ textDecoration: 'none' }}>
                        <button style={{
                          padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff', border: 'none',
                          cursor: 'pointer', transition: 'background 150ms'
                        }}>
                          {actionButtonText}
                        </button>
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          const tabBar = document.querySelector('[role="tablist"]');
                          if (tabBar) tabBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        style={{
                          padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                          background: brand.primary, color: '#fff', border: 'none',
                          cursor: 'pointer', transition: 'background 150ms'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                        onMouseLeave={e => e.currentTarget.style.background = brand.primary}
                      >
                        {actionButtonText}
                      </button>
                    )
                  )}
                  {academicYear && (
                    <span style={{
                      padding: '6px 14px', borderRadius: 16, fontSize: 13, fontWeight: 500,
                      background: brand.primarySurface, color: brand.primary,
                      border: `1px solid ${brand.primarySurface}`
                    }}>
                      {academicYear}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Statistics Section ── */}
        <section style={{ background: '#fff', borderBottom: `1px solid ${brand.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
              {stats.map((stat, index) => (
                <div key={index} style={{

                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 14,
                  background: brand.bg, border: `1px solid ${brand.border}`
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: brand.primarySurface, color: brand.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, lineHeight: 1.1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tabs Section ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
          {/* Tab bar */}
          <div
            ref={tabBarRef}
            role="tablist"
            aria-label="Page sections"
            style={{
              display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto',
              paddingBottom: 4, scrollbarWidth: 'thin',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                data-active={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                  border: activeTab === tab.id ? 'none' : `1px solid ${brand.border}`,
                  background: activeTab === tab.id ? brand.primary : '#fff',
                  color: activeTab === tab.id ? '#fff' : brand.textSecondary,
                  cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
                  boxShadow: activeTab === tab.id ? '0 2px 6px rgba(13,148,136,0.2)' : 'none',
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${brand.primary}44`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = activeTab === tab.id ? '0 2px 6px rgba(13,148,136,0.2)' : 'none'; }}
              >
                <span style={{ display: 'flex', opacity: activeTab === tab.id ? 1 : 0.7 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`,
            padding: '8px 14px', maxWidth: 360,
          }}>
            <Search size={16} style={{ color: brand.textTertiary, flexShrink: 0 }} />
            <input
              type="text"

              placeholder={t('search_placeholder', 'Search this page...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', outline: 'none', width: '100%',
                fontSize: 13, color: brand.textPrimary, background: 'transparent',

              }}
            />
            {searchQuery && (
              <button
                data-has-handler="true"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: brand.textTertiary }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tab content with fade transition */}
          <div
            ref={contentRef}
            onClick={handleContentClick}
            style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${brand.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: 24,
              opacity: tabFade ? 1 : 0,
              transform: tabFade ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 150ms ease, transform 150ms ease',
            }}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                role="tabpanel"
                id={`tabpanel-${tab.id}`}
                aria-labelledby={tab.id}
                data-active-panel={activeTab === tab.id}
                style={{ display: activeTab === tab.id ? 'block' : 'none' }}
              >
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EducationPathwayLayout;
