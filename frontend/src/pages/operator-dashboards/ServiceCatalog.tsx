import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { serviceGroups, allServices, serviceStats, ServiceItem, ServiceGroup } from '@/data/serviceCatalogData';

/* ─── English translations for group names ─────────────────────────── */
const groupNameEN: Record<string, string> = {
  CS: 'Career Pathway Services',
  CG: 'Career Guidance Services',
  TD: 'Training & Development',
  EJ: 'Employment Services',
  ER: 'Employer Services',
  DC: 'Certification Services',
  CP: 'Career Planning Services',
  EN: 'Mentoring & Guidance',
  SP: 'Educational Programs',
  CM: 'Community Services',
  TS: 'Operational Support',
  GI: 'Inquiry Services',
  IP: 'Partnership Services',
  EM: 'Early Follow-up Services',
};

/* ─── Color map for named group colors ─────────────────────────────── */
const colorMap: Record<string, string> = {
  teal:   '#0d9488',
  blue:   '#2563eb',
  indigo: '#6366f1',
  green:  '#16a34a',
  orange: '#ea580c',
  purple: '#9333ea',
  cyan:   '#0891b2',
  amber:  '#d97706',
  rose:   '#e11d48',
  red:    '#dc2626',
  pink:   '#ec4899',
  sky:    '#0284c7',
  lime:   '#65a30d',
  emerald:'#059669',
};

const resolveColor = (c: string) => colorMap[c] || c;

/* ─── Status helpers ───────────────────────────────────────────────── */
const statusMeta: Record<string, { color: string; bg: string; labelEN: string; labelAR: string }> = {
  active:     { color: '#059669', bg: '#d1fae5', labelEN: 'Active',     labelAR: 'مفعّل' },
  partial:    { color: '#d97706', bg: '#fef3c7', labelEN: 'Partial',    labelAR: 'جزئي' },
  gap:        { color: '#dc2626', bg: '#fee2e2', labelEN: 'Gap',        labelAR: 'فجوة' },
  correction: { color: '#9333ea', bg: '#f3e8ff', labelEN: 'Correction', labelAR: 'تصحيح' },
};

type StatusFilter = 'all' | 'active' | 'partial' | 'gap' | 'new' | 'correction';

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */
const ServiceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  /* ── state ─────────────────────────────────────────────────────────── */
  const [selectedGroup, setSelectedGroup]     = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery]         = useState('');
  const [hoveredCard, setHoveredCard]         = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup]       = useState<string | null>(null);

  /* ── filtered services ─────────────────────────────────────────────── */
  const filteredServices = useMemo(() => {
    let list = selectedGroup
      ? allServices.filter(s => s.groupCode === selectedGroup)
      : allServices;

    if (statusFilter === 'new') {
      list = list.filter(s => s.isNew);
    } else if (statusFilter === 'correction') {
      list = list.filter(s => s.isCorrection);
    } else if (statusFilter !== 'all') {
      list = list.filter(s => s.platformStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        s =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }

    return list;
  }, [selectedGroup, statusFilter, searchQuery]);

  /* ── filter pills ──────────────────────────────────────────────────── */
  const filterOptions: { key: StatusFilter; en: string; ar: string }[] = [
    { key: 'all',        en: 'All',        ar: 'الكل' },
    { key: 'active',     en: 'Active',     ar: 'مفعّل' },
    { key: 'partial',    en: 'Partial',    ar: 'جزئي' },
    { key: 'gap',        en: 'Gap',        ar: 'فجوة' },
    { key: 'new',        en: 'New',        ar: 'جديد' },
    { key: 'correction', en: 'Correction', ar: 'تصحيح' },
  ];

  /* ═══════════════════════════════════════════════════════════════════
     Render helpers
     ═══════════════════════════════════════════════════════════════════ */
  const StatusBadge = ({ status }: { status: string }) => {
    const m = statusMeta[status] || statusMeta.gap;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          color: m.color,
          background: m.bg,
          border: `1px solid ${m.color}30`,
          letterSpacing: 0.3,
        }}
      >
        {isRTL ? m.labelAR : m.labelEN}
      </span>
    );
  };

  /* ─── Section component for modal ──────────────────────────────────── */
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid #e2e8f0',
          letterSpacing: 0.2,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{value}</div>
      </div>
    ) : null;

  /* ═══════════════════════════════════════════════════════════════════
     MAIN RETURN
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a',
      }}
    >
      {/* ─────────────────────── TOP BAR ─────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 28px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'sticky' as const,
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            borderRadius: 8,
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          {isRTL ? '→' : '←'} {t('Back to Platform', 'العودة للمنصة')}
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: -0.3 }}>
            {t('EHRDC Service Catalog', 'دليل خدمات المجلس')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {t('Emirati Human Resources Development Council', 'مجلس تنمية الموارد البشرية الإماراتية')}
          </div>
        </div>

        {/* Spacer to balance flex */}
        <div style={{ width: 160 }} />
      </div>

      {/* ─────────────────── STATS SUMMARY ROW ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          padding: '20px 28px 0',
        }}
      >
        {[
          { label: t('Total Services', 'إجمالي الخدمات'),          value: serviceStats.totalServices, color: '#3b82f6', bg: '#eff6ff' },
          { label: t('Active on Platform', 'مفعّل على المنصة'),   value: serviceStats.activeServices, color: '#059669', bg: '#d1fae5' },
          { label: t('Partial Coverage', 'تغطية جزئية'),           value: serviceStats.partialServices, color: '#d97706', bg: '#fef3c7' },
          { label: t('Gap (Needs Dev)', 'فجوة (يتطلب تطوير)'),     value: serviceStats.gapServices, color: '#dc2626', bg: '#fee2e2' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              transition: 'box-shadow 0.2s, transform 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                color: stat.color,
                fontFeatureSettings: '"tnum"',
                flexShrink: 0,
              }}
            >
              {stat.value}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{stat.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {t('services', 'خدمة')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────── FILTER CONTROLS ────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 28px',
          flexWrap: 'wrap' as const,
        }}
      >
        {/* Status pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {filterOptions.map(f => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  border: active ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                  background: active ? '#3b82f6' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t(f.en, f.ar)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' as const }}>
          <input
            type="text"
            placeholder={t('Search services by name or code...', 'بحث عن خدمة بالاسم أو الرمز...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              paddingRight: isRTL ? 14 : 36,
              paddingLeft: isRTL ? 36 : 14,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: 13,
              color: '#334155',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
          />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: isRTL ? 'auto' : 12,
              left: isRTL ? 12 : 'auto',
              fontSize: 14,
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* ──────────── SIDEBAR + CONTENT LAYOUT ──────────────────── */}
      <div style={{ display: 'flex', padding: '0 28px 28px', gap: 20, minHeight: 'calc(100vh - 280px)' }}>
        {/* ─── LEFT SIDEBAR ──────────────────────────────────────── */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: '12px 0',
            alignSelf: 'flex-start',
            position: 'sticky' as const,
            top: 76,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto' as const,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase' as const,
              letterSpacing: 1,
            }}
          >
            {t('Service Groups', 'مجموعات الخدمات')}
          </div>

          {/* All Services */}
          <button
            onClick={() => setSelectedGroup(null)}
            onMouseEnter={() => setHoveredGroup('__all')}
            onMouseLeave={() => setHoveredGroup(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: selectedGroup === null
                ? '#eff6ff'
                : hoveredGroup === '__all'
                  ? '#f8fafc'
                  : 'transparent',
              borderRight: isRTL ? (selectedGroup === null ? '3px solid #3b82f6' : '3px solid transparent') : 'none',
              borderLeft: isRTL ? 'none' : (selectedGroup === null ? '3px solid #3b82f6' : '3px solid transparent'),
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#3b82f6',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: selectedGroup === null ? 600 : 400,
                color: selectedGroup === null ? '#1e40af' : '#475569',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('All Services', 'جميع الخدمات')}
            </span>
            <span
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {allServices.length}
            </span>
          </button>

          {/* Group items */}
          {serviceGroups.map(g => {
            const gc = resolveColor(g.color);
            const isActive = selectedGroup === g.code;
            const isHover = hoveredGroup === g.code;
            return (
              <button
                key={g.code}
                onClick={() => setSelectedGroup(isActive ? null : g.code)}
                onMouseEnter={() => setHoveredGroup(g.code)}
                onMouseLeave={() => setHoveredGroup(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: isActive
                    ? `${gc}12`
                    : isHover
                      ? '#f8fafc'
                      : 'transparent',
                  borderRight: isRTL ? (isActive ? `3px solid ${gc}` : '3px solid transparent') : 'none',
                  borderLeft: isRTL ? 'none' : (isActive ? `3px solid ${gc}` : '3px solid transparent'),
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: gc,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 6px ${gc}60` : 'none',
                  }}
                />
                <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? gc : '#334155',
                      lineHeight: 1.3,
                    }}
                  >
                    {isRTL ? g.name : (groupNameEN[g.code] || g.name)}
                  </div>
                  {!isRTL && (
                    <div style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.2, marginTop: 1 }}>
                      {g.name}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    background: isActive ? `${gc}20` : '#f1f5f9',
                    color: isActive ? gc : '#64748b',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {g.services.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── MAIN AREA ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results count */}
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
            {t(
              `Showing ${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''}`,
              `عرض ${filteredServices.length} خدمة`,
            )}
            {selectedGroup && (
              <span style={{ color: resolveColor(serviceGroups.find(g => g.code === selectedGroup)?.color || ''), fontWeight: 600 }}>
                {' — '}
                {isRTL
                  ? serviceGroups.find(g => g.code === selectedGroup)?.name
                  : groupNameEN[selectedGroup] || selectedGroup}
              </span>
            )}
          </div>

          {/* Cards Grid */}
          {filteredServices.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>
                {t('No services match your filters', 'لا توجد خدمات تطابق الفلاتر')}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {t('Try adjusting your search or filters', 'جرّب تعديل البحث أو الفلاتر')}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 16,
              }}
            >
              {filteredServices.map(service => {
                const gc = resolveColor(
                  serviceGroups.find(g => g.code === service.groupCode)?.color || 'blue',
                );
                const isHover = hoveredCard === service.code;
                return (
                  <div
                    key={service.code}
                    onClick={() => setSelectedService(service)}
                    onMouseEnter={() => setHoveredCard(service.code)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: '#ffffff',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      boxShadow: isHover
                        ? '0 8px 24px rgba(0,0,0,0.08)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      transform: isHover ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    {/* Card accent bar */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${gc}, ${gc}80)` }} />

                    {/* Card body */}
                    <div style={{ padding: '16px 20px' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        {/* Code badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 6,
                            background: `${gc}15`,
                            color: gc,
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          {service.code}
                        </span>

                        {/* Name */}
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                          {service.name}
                        </div>

                        {/* Status + badges */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap' as const, justifyContent: 'flex-end' }}>
                          <StatusBadge status={service.platformStatus} />
                          {service.isNew && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#0d9488',
                                background: '#ccfbf1',
                                border: '1px solid #0d948830',
                              }}
                            >
                              {t('New', 'جديد')}
                            </span>
                          )}
                          {service.isCorrection && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#b45309',
                                background: '#fef3c7',
                                border: '1px solid #b4530930',
                              }}
                            >
                              {t('Correction', 'تصحيح')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div
                        style={{
                          fontSize: 12.5,
                          color: '#64748b',
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}
                      >
                        {service.description}
                      </div>

                      {/* Footer meta */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {isRTL ? service.group : (groupNameEN[service.groupCode] || service.group)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: '#3b82f6',
                            fontWeight: 500,
                          }}
                        >
                          {t('View details →', '← عرض التفاصيل')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         SERVICE DETAIL MODAL
         ═══════════════════════════════════════════════════════════ */}
      {selectedService && (() => {
        const s = selectedService;
        const gc = resolveColor(
          serviceGroups.find(g => g.code === s.groupCode)?.color || 'blue',
        );
        const sm = statusMeta[s.platformStatus] || statusMeta.gap;

        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSelectedService(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
                animation: 'fadeIn 0.2s ease',
              }}
            />

            {/* Modal */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                right: isRTL ? 'auto' : 0,
                left: isRTL ? 0 : 'auto',
                width: '100%',
                maxWidth: 640,
                background: '#ffffff',
                zIndex: 101,
                overflowY: 'auto',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
                animation: isRTL ? 'slideInLeft 0.25s ease' : 'slideInRight 0.25s ease',
              }}
            >
              {/* Modal accent */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${gc}, ${gc}60)` }} />

              {/* Modal header */}
              <div
                style={{
                  padding: '20px 28px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  position: 'sticky',
                  top: 0,
                  background: '#ffffff',
                  zIndex: 2,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' as const }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        background: `${gc}15`,
                        color: gc,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {s.code}
                    </span>
                    <StatusBadge status={s.platformStatus} />
                    {s.isNew && (
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: '#0d9488', background: '#ccfbf1' }}>
                        {t('New', 'جديد')}
                      </span>
                    )}
                    {s.isCorrection && (
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fef3c7' }}>
                        {t('Correction', 'تصحيح')}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
                    {s.name}
                  </h2>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {isRTL ? s.group : (groupNameEN[s.groupCode] || s.group)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '20px 28px 40px' }}>
                {/* Section 1: Overview */}
                <Section title={t('Overview', 'نظرة عامة')}>
                  <Field label={t('Description', 'الوصف')} value={s.description} />
                  <Field label={t('Goal', 'الهدف')} value={s.goal} />
                </Section>

                {/* Section 2: Target & Requirements */}
                <Section title={t('Target & Requirements', 'الفئة المستهدفة والمتطلبات')}>
                  <Field label={t('Target Audience', 'الفئة المستهدفة')} value={s.target} />
                  <Field label={t('Conditions', 'الشروط')} value={s.conditions} />
                  <Field label={t('Required Documents', 'المستندات المطلوبة')} value={s.documents} />
                </Section>

                {/* Section 3: Service Steps */}
                {s.steps && s.steps.length > 0 && (
                  <Section title={t('Service Steps', 'خطوات الخدمة')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {s.steps.map((step, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '10px 0',
                            borderBottom: i < s.steps.length - 1 ? '1px solid #f1f5f9' : 'none',
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: `${gc}15`,
                              color: gc,
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, paddingTop: 3 }}>
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Section 4: Delivery */}
                <Section title={t('Delivery', 'آلية التقديم')}>
                  <Field label={t('Channels', 'القنوات')} value={s.channels} />
                  <Field label={t('Duration', 'المدة')} value={s.duration} />
                  <Field label={t('Fees', 'الرسوم')} value={s.fees} />
                </Section>

                {/* Section 5: Outcomes */}
                <Section title={t('Outcomes', 'المخرجات')}>
                  <Field label={t('Outputs', 'المخرجات')} value={s.outputs} />
                  <Field label={t('Limitations', 'القيود')} value={s.limitations} />
                </Section>

                {/* Section 6: Stakeholders */}
                <Section title={t('Stakeholders', 'أصحاب المصلحة')}>
                  <Field label={t('Partners', 'الشركاء')} value={s.partners} />
                  <Field label={t('KPIs', 'مؤشرات الأداء')} value={s.kpis} />
                </Section>

                {/* Section 7: Platform Integration */}
                <Section title={t('Platform Integration', 'التكامل مع المنصة')}>
                  <div
                    style={{
                      background: sm.bg,
                      border: `1px solid ${sm.color}30`,
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: sm.color,
                          boxShadow: `0 0 6px ${sm.color}60`,
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: sm.color }}>
                        {isRTL ? sm.labelAR : sm.labelEN}
                      </span>
                    </div>
                    {s.platformModule && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                          {t('Module:', 'الوحدة:')}
                        </span>{' '}
                        <code
                          style={{
                            fontSize: 12,
                            color: '#334155',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {s.platformModule}
                        </code>
                      </div>
                    )}
                    {s.platformPath && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                          {t('Path:', 'المسار:')}
                        </span>{' '}
                        <code
                          style={{
                            fontSize: 12,
                            color: '#334155',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {s.platformPath}
                        </code>
                      </div>
                    )}
                    {s.gapNotes && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600 }}>{t('Notes:', 'ملاحظات:')}</span> {s.gapNotes}
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            </div>
          </>
        );
      })()}

      {/* ─── Animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ServiceCatalog;
