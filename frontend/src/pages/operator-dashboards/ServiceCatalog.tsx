import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
  serviceGroups, allServices, serviceStats, ServiceItem, ServiceGroup,
  allRoles, roleServiceMap, roleLabels, aiModelCount,
} from '@/data/serviceCatalogData';

/* ─── SVG Icon Components (replace emojis that don't render in Docker) ─── */
const SvgIcon: React.FC<{ d: string; color: string; size?: number }> = ({ d, color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IconClipboard: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" color={color} size={size} />
);
const IconCheck: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const IconAlert: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);
const IconCircle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill={color} stroke="none">
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const IconFolder: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" color={color} size={size} />
);
const IconSparkle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <SvgIcon d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" color={color} size={size} />
);
const IconCpu: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
    <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
  </svg>
);
const IconUsers: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconChart: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
  </svg>
);
const IconShuffle: React.FC<{ color: string; size?: number }> = ({ color, size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
    <path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" />
  </svg>
);

/* ─── Constants ──────────────────────────────────────────────────── */
/* groupNameEN map removed — now using g.nameEN from JSON */

const statusMeta: Record<string, { color: string; bg: string; labelEN: string; labelAR: string }> = {
  active:     { color: '#059669', bg: '#d1fae5', labelEN: 'Active',     labelAR: 'مفعّل' },
  partial:    { color: '#d97706', bg: '#fef3c7', labelEN: 'Partial',    labelAR: 'جزئي' },
  gap:        { color: '#dc2626', bg: '#fee2e2', labelEN: 'Gap',        labelAR: 'فجوة' },
  correction: { color: '#7c3aed', bg: '#ede9fe', labelEN: 'Correction', labelAR: 'تصحيح' },
};

/* Platform design tokens */
const TEAL = '#006E6D';
const TEAL_LIGHT = '#ecfdf5';
const TEAL_600 = '#059669';
const TEAL_DEEP = '#0A4D4C';
const INK = '#0f2b2a';        // near-black with a teal bias, not pure slate
const INK_MUTED = '#5b7573';
const FONT = '"Readex Pro", "Dubai", system-ui, -apple-system, sans-serif';

// Harmonised, teal-anchored palette for the 14 service groups. The catalog
// data stores Tailwind-ish colour NAMES (teal/amber/cyan/rose/…) that were
// rendered directly as CSS, producing a clashing neon rainbow. This maps each
// to a deep, muted hue that reads as one system alongside the EHRDC teal and
// works on white. Semantic status colours (active/partial/gap) stay separate.
const GROUP_PALETTE: Record<string, string> = {
  teal: '#006E6D', emerald: '#0B7A6A', green: '#2F7D4F', cyan: '#0E7490',
  sky: '#0B6BA8', blue: '#1E5A9C', indigo: '#3F4EA8', violet: '#6A54A6',
  purple: '#7A548F', rose: '#A65468', orange: '#BC5A2E', amber: '#A9740F',
  slate: '#4A5A6B', gray: '#64748B',
};
const gcHex = (name?: string) => GROUP_PALETTE[(name || '').toLowerCase()] || '#4A5A6B';

const tabDefs = [
  { key: 'overview',  en: 'Overview',                           ar: 'نظرة عامة' },
  { key: 'map',       en: 'Platform Map',                       ar: 'خريطة المنصة' },
  { key: 'services',  en: 'Service Cards',                      ar: 'بطاقات الخدمات' },
  { key: 'roles',     en: 'Roles & Responsibilities',           ar: 'الأدوار والمسؤوليات' },
  { key: 'gap',       en: 'Mapping Matrix & Gap Analysis',      ar: 'مصفوفة الربط وتحليل الفجوات' },
] as const;

type TabKey = typeof tabDefs[number]['key'];

const consolidations = [
  { title: 'Career Hub', titleAR: 'مركز المسار المهني', canonical: '/career-hub', routes: ['/career-advisory', '/career-simulator', '/industry-exploration', '/career-planning-hub'] },
  { title: 'Credentials Center', titleAR: 'مركز الاعتمادات', canonical: '/credentials', routes: ['/career-passport', '/blockchain-credentials', '/professional-certifications'] },
  { title: 'Communities', titleAR: 'المجتمعات', canonical: '/communities', routes: ['/thought-leadership', '/share-success-stories'] },
  { title: 'Profile Studio', titleAR: 'استوديو الملف الشخصي', canonical: '/candidate/profile/*', routes: ['/cv-builder', '/resume-builder'] },
  { title: 'Government Dashboard', titleAR: 'اللوحة الحكومية', canonical: '/government-dashboard', routes: ['/emiratization-tracker'] },
];

const IconChevron: React.FC<{ color: string; size?: number; open?: boolean }> = ({ color, size = 16, open }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(90deg)' : 'none' }}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconExpand: React.FC<{ color: string; size?: number }> = ({ color, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8V5a2 2 0 0 1 2-2h3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M21 16v3a2 2 0 0 1-2 2h-3" />
  </svg>
);
const IconMaximize: React.FC<{ color: string; size?: number }> = ({ color, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);
const IconMinimize: React.FC<{ color: string; size?: number }> = ({ color, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

/* ─── Interactive Platform Map (mind map) ──────────────────────────
   A branching map of the platform: root → main areas → the 14 service
   groups / roles / status buckets. Curved SVG connectors on a dotted
   canvas, expand/collapse (with an "expand all" toggle), inactive
   branches dim to focus attention, every leaf jumps into the relevant
   catalog tab, and the open/closed state persists in localStorage.
   Rendered on the light EHRDC theme (the reference mock was dark; the
   platform is light-only — PR #82). */
type MapNode = {
  id: string;
  label: string;
  sub?: string;
  color: string;
  count?: number;
  children?: MapNode[];
  onOpen?: () => void;
};

const MM_STORE = 'ehrdc-sc-mindmap-v1';

const PlatformMindMap: React.FC<{
  isRTL: boolean;
  t: (en: string, ar: string) => string;
  onOpenGroup: (code: string) => void;
  onOpenRole: (role: string) => void;
  onOpenTab: (tab: string) => void;
}> = ({ isRTL, t, onOpenGroup, onOpenRole, onOpenTab }) => {
  const BRANCH = { catalog: TEAL, roles: '#1E5A9C', matrix: '#2F7D4F', overview: '#3F4EA8' };

  /* Build the tree (localised) */
  const tree = useMemo<MapNode>(() => {
    const gnl = (g: ServiceGroup) => isRTL ? g.name : (g.nameEN || g.name);
    const catalog: MapNode = {
      id: 'catalog', color: BRANCH.catalog,
      label: t('Service Catalog', 'كتالوج الخدمات'),
      sub: t(`${serviceStats.totalGroups} groups · ${serviceStats.totalServices} cards`, `${serviceStats.totalGroups} مجموعة · ${serviceStats.totalServices} بطاقة`),
      children: serviceGroups.map(g => ({
        id: `g-${g.code}`, label: gnl(g), color: gcHex(g.color), count: g.services.length,
        sub: t(`${g.services.length} services`, `${g.services.length} خدمات`),
        onOpen: () => onOpenGroup(g.code),
      })),
    };
    const roles: MapNode = {
      id: 'roles', color: BRANCH.roles,
      label: t('Roles & Responsibilities', 'الأدوار والصلاحيات'),
      sub: t(`${allRoles.length} platform roles`, `${allRoles.length} دوراً على المنصة`),
      children: allRoles.map(r => {
        const rl = roleLabels[r];
        return {
          id: `r-${r}`, label: rl ? (isRTL ? rl.ar : rl.en) : r, color: BRANCH.roles,
          count: roleServiceMap[r]?.length || 0,
          sub: t(`${roleServiceMap[r]?.length || 0} services`, `${roleServiceMap[r]?.length || 0} خدمة`),
          onOpen: () => onOpenRole(r),
        };
      }),
    };
    const matrix: MapNode = {
      id: 'matrix', color: BRANCH.matrix,
      label: t('Mapping Matrix', 'مصفوفة الربط'),
      sub: t('Coverage & gaps', 'التغطية والفجوات'),
      children: [
        { id: 'm-active',  label: t('Active', 'مفعّل'),  color: statusMeta.active.color,  count: serviceStats.activeServices,  onOpen: () => onOpenTab('gap') },
        { id: 'm-partial', label: t('Partial', 'جزئي'), color: statusMeta.partial.color, count: serviceStats.partialServices, onOpen: () => onOpenTab('gap') },
        { id: 'm-gap',     label: t('Gap', 'فجوة'),      color: statusMeta.gap.color,     count: serviceStats.gapServices,     onOpen: () => onOpenTab('gap') },
      ],
    };
    const overview: MapNode = {
      id: 'overview', color: BRANCH.overview,
      label: t('Overview', 'نظرة عامة'),
      sub: t('Coverage dashboard', 'لوحة التغطية'),
      onOpen: () => onOpenTab('overview'),
    };
    return {
      id: 'root', color: TEAL,
      label: t('EHRDC Platform', 'منصة تنمية الموارد البشرية'),
      sub: t(`${serviceStats.totalServices} services · ${serviceStats.totalGroups} groups · ${allRoles.length} roles`, `${serviceStats.totalServices} خدمة · ${serviceStats.totalGroups} مجموعة · ${allRoles.length} دوراً`),
      children: [catalog, roles, matrix, overview],
    };
  }, [isRTL]); // eslint-disable-line react-hooks/exhaustive-deps

  const expandableIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: MapNode) => { if (n.children?.length) { ids.push(n.id); n.children.forEach(walk); } };
    walk(tree);
    return ids;
  }, [tree]);

  /* Expand state (persisted) */
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(MM_STORE);
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set(['root']); // compact default: platform + its four main branches
  });
  useEffect(() => {
    try { localStorage.setItem(MM_STORE, JSON.stringify([...expanded])); } catch { /* ignore */ }
  }, [expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allExpanded = expandableIds.every(id => expanded.has(id));
  const expandAll = () => setExpanded(allExpanded ? new Set(['root']) : new Set(expandableIds));

  /* Which top-level branch is solo-open → dim the siblings */
  const topBranches = tree.children || [];
  const openExpandableTop = topBranches.filter(b => b.children?.length && expanded.has(b.id));
  const activeBranch = openExpandableTop.length === 1 ? openExpandableTop[0].id : null;

  /* ─── Connector geometry (measured) ─── */
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el); else nodeRefs.current.delete(id);
  };
  const stageRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<{ d: string; color: string; dim: boolean }[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const ZOOM_MIN = 0.5, ZOOM_MAX = 2, ZOOM_STEP = 0.25;
  const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const resetZoom = () => setZoom(1);

  // Visible parent→child pairs given the current expand state.
  const pairs = useMemo(() => {
    const out: { parent: string; child: string; color: string; branch: string }[] = [];
    const walk = (n: MapNode, branch: string) => {
      if (n.children?.length && expanded.has(n.id)) {
        n.children.forEach(c => {
          const b = n.id === 'root' ? c.id : branch;
          out.push({ parent: n.id, child: c.id, color: c.color, branch: b });
          walk(c, b);
        });
      }
    };
    walk(tree, 'root');
    return out;
  }, [tree, expanded]);

  const recompute = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Measure in the stage's UNSCALED local coordinates: getBoundingClientRect
    // returns on-screen (scaled) pixels, so subtract the stage's top-left
    // (which, with transform-origin 0 0, is where local (0,0) renders) and
    // divide by the zoom factor. The SVG lives inside the same scaled stage,
    // so paths drawn in these local units line up at any zoom.
    const s = stage.getBoundingClientRect();
    const z = zoom || 1;
    const next: { d: string; color: string; dim: boolean }[] = [];
    pairs.forEach(({ parent, child, color, branch }) => {
      const pe = nodeRefs.current.get(parent);
      const ce = nodeRefs.current.get(child);
      if (!pe || !ce) return;
      const p = pe.getBoundingClientRect();
      const q = ce.getBoundingClientRect();
      const sx = ((isRTL ? p.left : p.right) - s.left) / z;
      const sy = (p.top + p.height / 2 - s.top) / z;
      const ex = ((isRTL ? q.right : q.left) - s.left) / z;
      const ey = (q.top + q.height / 2 - s.top) / z;
      const mx = (sx + ex) / 2;
      next.push({
        d: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`,
        color,
        dim: !!activeBranch && branch !== activeBranch,
      });
    });
    setLinks(next);
    setSvgSize({ w: stage.scrollWidth, h: stage.scrollHeight });
  }, [pairs, isRTL, activeBranch, zoom]);

  // Recompute connectors on layout, on window resize, and whenever the
  // fullscreen state or zoom changes (the canvas changes size without a
  // resize event).
  useLayoutEffect(() => { recompute(); }, [recompute, fullscreen]);
  // Leaving full screen returns to 1:1 (zoom is a full-screen-only control).
  useEffect(() => { if (!fullscreen) setZoom(1); }, [fullscreen]);
  useEffect(() => {
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [recompute]);

  // Fullscreen: lock body scroll and allow Esc to exit.
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  /* ─── Node box ─── */
  const NodeBox: React.FC<{ node: MapNode; level: number; branchId: string | null }> = ({ node, level, branchId }) => {
    const hasChildren = !!node.children?.length;
    const isOpen = expanded.has(node.id);
    const dim = !!activeBranch && level >= 1 && branchId !== null && branchId !== activeBranch;
    const isRoot = level === 0;
    const isLeaf = !hasChildren;

    const handle = () => { if (hasChildren) toggle(node.id); else node.onOpen?.(); };

    return (
      <div
        ref={setNodeRef(node.id)}
        onClick={handle}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } }}
        title={hasChildren ? t('Click to expand / collapse', 'انقر للتوسيع / الطي') : t('Open in catalog →', 'فتح في الدليل ←')}
        style={{
          position: 'relative', zIndex: 2, cursor: 'pointer', userSelect: 'none',
          opacity: dim ? 0.38 : 1, transition: 'opacity 0.25s, transform 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
          padding: isRoot ? '16px 22px' : level === 1 ? '13px 18px' : '9px 14px',
          borderRadius: isRoot ? 16 : level === 1 ? 13 : 10,
          background: isRoot
            ? `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`
            : level === 1 ? '#fff' : '#fff',
          color: isRoot ? '#fff' : INK,
          border: isRoot ? 'none' : `1.5px solid ${level === 1 ? node.color : `${node.color}33`}`,
          borderInlineStart: isLeaf && !isRoot ? `3px solid ${node.color}` : undefined,
          boxShadow: isRoot
            ? `0 10px 28px ${TEAL}44`
            : level === 1 ? `0 4px 14px ${node.color}1f` : '0 1px 3px rgba(10,45,44,.06)',
        }}
        onMouseEnter={e => { if (!isRoot) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = level === 1 ? `0 8px 22px ${node.color}33` : `0 4px 12px ${node.color}2a`; } }}
        onMouseLeave={e => { if (!isRoot) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = level === 1 ? `0 4px 14px ${node.color}1f` : '0 1px 3px rgba(10,45,44,.06)'; } }}
      >
        {!isRoot && level >= 2 && <span style={{ width: 9, height: 9, borderRadius: '50%', background: node.color, flexShrink: 0 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isRoot ? 3 : 1, minWidth: 0 }}>
          <span style={{ fontSize: isRoot ? 16 : level === 1 ? 14 : 12.5, fontWeight: isRoot ? 800 : level === 1 ? 700 : 600, color: isRoot ? '#fff' : (level === 1 ? node.color : INK), letterSpacing: isRoot ? '-0.01em' : 0 }}>
            {node.label}
          </span>
          {node.sub && (
            <span style={{ fontSize: isRoot ? 11.5 : 10.5, fontWeight: 500, color: isRoot ? 'rgba(255,255,255,.85)' : INK_MUTED, fontVariantNumeric: 'tabular-nums' }}>
              {node.sub}
            </span>
          )}
        </div>
        {typeof node.count === 'number' && level >= 2 && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: node.color, background: `${node.color}18`, borderRadius: 9, padding: '2px 8px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{node.count}</span>
        )}
        {hasChildren && !isRoot && <IconChevron color={level === 1 ? node.color : INK_MUTED} open={isOpen} size={16} />}
        {hasChildren && isRoot && <IconChevron color="#fff" open={isOpen} size={18} />}
      </div>
    );
  };

  /* ─── Recursive branch (node + its children column) ─── */
  const Branch: React.FC<{ node: MapNode; level: number; branchId: string | null }> = ({ node, level, branchId }) => {
    const isOpen = expanded.has(node.id);
    const showKids = !!node.children?.length && isOpen;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
        <NodeBox node={node} level={level} branchId={branchId} />
        {showKids && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {node.children!.map(c => (
              <Branch key={c.id} node={c} level={level + 1} branchId={level === 0 ? c.id : branchId} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={fullscreen ? {
      position: 'fixed', inset: 0, zIndex: 3000, background: '#eef4f4',
      padding: '18px 22px', display: 'flex', flexDirection: 'column',
      direction: isRTL ? 'rtl' : 'ltr', fontFamily: FONT,
    } : undefined}>
      {/* Header row: title + controls */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK, display: 'flex', alignItems: 'center', gap: 9 }}>
            <IconExpand color={TEAL} size={19} /> {t('Interactive Platform Map', 'خريطة المنصة التفاعلية')}
          </div>
          <div style={{ fontSize: 12.5, color: INK_MUTED, marginTop: 4 }}>
            {t('Explore the full platform structure — click a node to expand, click a leaf to open it in the catalog.', 'استعرض هيكل المنصة الكامل — انقر على عقدة لتوسيعها، وانقر على ورقة لفتحها في الدليل.')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={expandAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12.5, fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: allExpanded ? TEAL : '#fff', color: allExpanded ? '#fff' : TEAL,
              border: `1.5px solid ${allExpanded ? TEAL : `${TEAL}40`}`,
            }}>
            <IconExpand color={allExpanded ? '#fff' : TEAL} size={15} />
            {allExpanded ? t('Collapse all', 'طي الكل') : t('Expand all', 'توسيع الكل')}
          </button>
          <button onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? t('Exit full screen (Esc)', 'إنهاء ملء الشاشة (Esc)') : t('Full screen', 'ملء الشاشة')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12.5, fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
              background: '#fff', color: TEAL, border: `1.5px solid ${TEAL}40`,
            }}>
            {fullscreen ? <IconMinimize color={TEAL} size={15} /> : <IconMaximize color={TEAL} size={15} />}
            {fullscreen ? t('Exit full screen', 'إنهاء ملء الشاشة') : t('Full screen', 'ملء الشاشة')}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef}
        style={{
          position: 'relative', overflow: 'auto', borderRadius: 16,
          border: '1px solid #e6ecec', background: '#f7fbfb',
          backgroundImage: 'radial-gradient(#d7e3e2 1px, transparent 1px)', backgroundSize: '22px 22px',
          padding: '36px 44px',
          minHeight: fullscreen ? 0 : 520, maxHeight: fullscreen ? 'none' : 720,
          flex: fullscreen ? 1 : undefined,
          boxShadow: 'inset 0 1px 3px rgba(10,45,44,.04)',
        }}>
        {/* Sizer: reserves the scaled footprint so the scroll area tracks zoom */}
        <div style={{
          position: 'relative', minWidth: '100%',
          width: svgSize.w ? svgSize.w * zoom : '100%',
          height: svgSize.h ? svgSize.h * zoom : (fullscreen ? '100%' : 448),
        }}>
          {/* Stage: scaled by zoom from the top-left; holds the connectors + nodes */}
          <div ref={stageRef} style={{
            position: 'absolute', top: 0, left: 0,
            transform: `scale(${zoom})`, transformOrigin: '0 0', width: 'max-content',
          }}>
            <svg width={svgSize.w || '100%'} height={svgSize.h || '100%'}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
              {links.map((l, i) => (
                <path key={i} d={l.d} fill="none" stroke={l.color} strokeWidth={2} strokeLinecap="round"
                  style={{ opacity: l.dim ? 0.18 : 0.6, transition: 'opacity 0.25s' }} />
              ))}
            </svg>
            <div style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', minHeight: 448 }}>
              <Branch node={tree} level={0} branchId={null} />
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls — full screen only */}
      {fullscreen && (
        <div style={{
          position: 'absolute', bottom: 26, left: 26, zIndex: 4,
          display: 'flex', alignItems: 'center', gap: 2,
          background: '#fff', border: '1px solid #e6ecec', borderRadius: 12,
          boxShadow: '0 6px 20px rgba(10,45,44,.14)', padding: 5,
        }}>
          <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title={t('Zoom out', 'تصغير')}
            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', color: zoom <= ZOOM_MIN ? '#c3d2d1' : TEAL, fontSize: 22, fontWeight: 700, lineHeight: 1, cursor: zoom <= ZOOM_MIN ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <button onClick={resetZoom} title={t('Reset zoom', 'إعادة الضبط')}
            style={{ minWidth: 52, height: 34, borderRadius: 8, border: 'none', background: 'transparent', color: INK, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}>{Math.round(zoom * 100)}%</button>
          <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title={t('Zoom in', 'تكبير')}
            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', color: zoom >= ZOOM_MAX ? '#c3d2d1' : TEAL, fontSize: 20, fontWeight: 700, lineHeight: 1, cursor: zoom >= ZOOM_MAX ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 14, fontSize: 11.5, color: INK_MUTED }}>
        {[
          { c: BRANCH.catalog, l: t('Service Catalog', 'كتالوج الخدمات') },
          { c: BRANCH.roles, l: t('Roles', 'الأدوار') },
          { c: BRANCH.matrix, l: t('Mapping Matrix', 'مصفوفة الربط') },
          { c: BRANCH.overview, l: t('Overview', 'نظرة عامة') },
        ].map(x => (
          <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c }} /> {x.l}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Helper Components ──────────────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, padding: '6px 0', borderBottom: '2px solid #e2e8f0' }}>{title}</div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, marginTop: 3, whiteSpace: 'pre-line' }}>{value}</div>
    </div>
  );
};

const StatCard: React.FC<{ value: number | string; label: string; color: string; iconEl?: React.ReactNode; small?: boolean; border?: string }> = ({ value, label, color, iconEl, small, border }) => (
  <div style={{
    position: 'relative', overflow: 'hidden',
    background: '#fff', border: `1px solid ${border || '#e6ecec'}`, borderRadius: 14,
    padding: small ? '15px 18px' : '19px 22px', flex: 1, minWidth: small ? 140 : 180,
    display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: '0 1px 2px rgba(10,45,44,.04), 0 6px 16px rgba(10,45,44,.05)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  }}>
    <div style={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 3, background: color }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: small ? 10.5 : 11.5, fontWeight: 600, color: INK_MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>{label}</div>
        <span style={{ fontSize: small ? 25 : 34, fontWeight: 800, color: INK, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      {iconEl && <div style={{ padding: small ? 8 : 10, background: `${color}14`, borderRadius: 12, display: 'flex' }}>{iconEl}</div>}
    </div>
  </div>
);

/* ─── Hero banner (brought over from the design reference, on the
   light EHRDC teal theme) ─────────────────────────────────────────── */
const CatalogHero: React.FC<{
  isRTL: boolean;
  t: (en: string, ar: string) => string;
  onBrowse: () => void;
  onMap: () => void;
  onRoles: () => void;
}> = ({ t, onBrowse, onMap, onRoles }) => (
  <div style={{
    position: 'relative', overflow: 'hidden', borderRadius: 20, marginBottom: 22,
    background: `linear-gradient(135deg, ${TEAL_DEEP} 0%, ${TEAL} 58%, #0a615f 100%)`,
    padding: '34px 36px', color: '#fff', boxShadow: `0 16px 40px ${TEAL}33`,
  }}>
    {/* decorative rings */}
    <div style={{ position: 'absolute', top: -70, insetInlineEnd: -30, width: 230, height: 230, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
    <div style={{ position: 'absolute', bottom: -90, insetInlineStart: '28%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 740 }}>
      <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {t('Curated Service Guide', 'دليل الخدمات المنسّق')}
      </span>
      <div style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.25, marginTop: 13, letterSpacing: '-0.01em' }}>
        {t('EHRDC Platform Services Guide', 'دليل خدمات منصة تنمية الموارد البشرية')}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.75, marginTop: 11, opacity: 0.92, maxWidth: 660 }}>
        {t(
          'A complete guide to the platform’s services — every documented service card with its authorized roles, delivery steps, and platform mapping. Browse the catalog, explore the interactive map, or review roles.',
          'دليل شامل لخدمات المنصة، يوثّق بطاقات الخدمة الكاملة مع الأدوار المخوّلة وخطوات التقديم وربطها بالمنصة. استعرض الكتالوج، أو استكشف الخريطة التفاعلية، أو راجع الأدوار.'
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        <button onClick={onBrowse}
          style={{ background: '#fff', color: TEAL, border: 'none', borderRadius: 11, padding: '11px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(0,0,0,0.14)', transition: 'transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <IconClipboard color={TEAL} size={17} /> {t('Browse Services', 'استعراض الخدمات')}
        </button>
        <button onClick={onMap}
          style={{ background: 'rgba(255,255,255,0.13)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', borderRadius: 11, padding: '11px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}>
          <IconExpand color="#fff" size={16} /> {t('Explore the Map', 'استكشف الخريطة')}
        </button>
        <button onClick={onRoles}
          style={{ background: 'rgba(255,255,255,0.13)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', borderRadius: 11, padding: '11px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}>
          <IconUsers color="#fff" size={16} /> {t('Roles & Responsibilities', 'الأدوار والصلاحيات')}
        </button>
      </div>
    </div>
  </div>
);

/* Solid-fill stat card in the reference's treatment, using our
   harmonised teal-family palette (not the mock's neon fills). */
const HeroStatCard: React.FC<{ value: number | string; label: string; sub: string; color: string; iconEl: React.ReactNode }> = ({ value, label, sub, color, iconEl }) => (
  <div style={{
    position: 'relative', overflow: 'hidden', flex: '1 1 150px', minWidth: 152,
    background: color, backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.18), transparent 62%)',
    borderRadius: 16, padding: '17px 19px', color: '#fff', boxShadow: `0 8px 20px ${color}30`,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
      <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 11, padding: 8, display: 'flex' }}>{iconEl}</div>
    </div>
    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────── */
const ServiceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  /** Translate a data field: given AR value and its EN counterpart */
  const tf = (ar: string, en: string) => isRTL ? ar : (en || ar);
  const gn = (g: ServiceGroup) => isRTL ? g.name : (g.nameEN || g.name);
  const sn = (s: ServiceItem) => tf(s.name, s.nameEN);
  const sd = (s: ServiceItem) => tf(s.description, s.descriptionEN);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  /* ─── Filtered services for Tab 2 ───── */
  const filteredServices = useMemo(() => {
    let list = selectedGroup ? allServices.filter(s => s.groupCode === selectedGroup) : allServices;
    if (statusFilter === 'new') list = list.filter(s => s.isNew);
    else if (statusFilter === 'correction') list = list.filter(s => s.isCorrection);
    else if (statusFilter !== 'all') list = list.filter(s => s.platformStatus === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.includes(q) || s.nameEN?.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.description.includes(q) || s.descriptionEN?.toLowerCase().includes(q));
    }
    return list;
  }, [selectedGroup, statusFilter, searchQuery]);

  const sortedGroups = useMemo(() =>
    [...serviceGroups].sort((a, b) => b.services.length - a.services.length), []
  );

  const groupByCode = (code: string) => serviceGroups.find(g => g.code === code);
  const gc = (s: ServiceItem) => gcHex(groupByCode(s.groupCode)?.color);
  const sm = (s: ServiceItem) => statusMeta[s.platformStatus] || statusMeta.active;
  const coverageRate = ((serviceStats.activeServices / serviceStats.totalServices) * 100).toFixed(1);

  /* ─── RENDER ────────────────────────────────────────────────────── */
  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr', fontFamily: FONT, background: '#F4F7F7', minHeight: '100vh', textAlign: isRTL ? 'right' : 'left' }}>
      {/* ─── Header ─── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${TEAL_DEEP}, ${TEAL}, ${TEAL_600})` }} />
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ecec', padding: '16px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1400, margin: '0 auto', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: '#fff', border: '1px solid #e6ecec', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: INK_MUTED, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(10,45,44,0.04)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f4f8f8'; e.currentTarget.style.borderColor = '#cfe0df'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e6ecec'; }}
          >
            {isRTL ? '→' : '←'} {t('Back to Platform', 'العودة للمنصة')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${TEAL}33` }}>
              <IconClipboard color="#fff" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: INK, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{t('EHRDC Service Catalog', 'دليل خدمات منصة تنمية الموارد البشرية')}</div>
              <div style={{ fontSize: 12, color: INK_MUTED, marginTop: 1 }}>{t('Emirati Human Resources Development Council', 'مجلس تنمية الموارد البشرية الإماراتية')}</div>
            </div>
          </div>
          <button onClick={toggleLanguage} style={{ background: TEAL_LIGHT, color: TEAL, border: `1px solid ${TEAL}30`, borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = TEAL_LIGHT; e.currentTarget.style.color = TEAL; }}
          >
            {isRTL ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {/* ─── Tab Bar (matches platform white tab style) ─── */}
      <div style={{ background: '#fff', padding: '8px 28px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 1400, margin: '0 auto', overflowX: 'auto' }}>
          {tabDefs.map(td => (
            <button key={td.key} onClick={() => setActiveTab(td.key)}
              style={{
                background: activeTab === td.key ? TEAL_LIGHT : 'transparent',
                color: activeTab === td.key ? TEAL : '#64748b',
                border: 'none', borderBottom: activeTab === td.key ? `2px solid ${TEAL}` : '2px solid transparent',
                padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === td.key ? 700 : 500,
                whiteSpace: 'nowrap', transition: 'all 0.15s', borderRadius: '8px 8px 0 0',
              }}
              onMouseEnter={e => { if (activeTab !== td.key) { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = '#f8fafc'; } }}
              onMouseLeave={e => { if (activeTab !== td.key) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; } }}
            >
              {t(td.en, td.ar)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>

        {/* ─── Reference-data notice (data is illustrative, not live platform metrics) ─── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12,
          padding: '12px 16px', marginBottom: 20,
        }}>
          <IconAlert color="#d97706" size={20} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              {t('Reference data — not live platform metrics', 'بيانات مرجعية — ليست مقاييس مباشرة للمنصة')}
            </div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2, lineHeight: 1.6 }}>
              {t(
                'This catalog reflects a curated service inventory. The counts, coverage rates, gauges and matrices shown here are illustrative reference figures, not real-time platform measurements.',
                'يعكس هذا الدليل مخزوناً منسّقاً للخدمات. الأعداد ومعدلات التغطية والمقاييس والمصفوفات المعروضة هنا هي أرقام مرجعية توضيحية وليست قياسات مباشرة للمنصة.'
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ TAB 1: OVERVIEW ═══════════════ */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Hero banner */}
            <CatalogHero
              isRTL={isRTL}
              t={t}
              onBrowse={() => setActiveTab('services')}
              onMap={() => setActiveTab('map')}
              onRoles={() => setActiveTab('roles')}
            />

            {/* Stat band (reference treatment, harmonised teal palette) */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <HeroStatCard value={serviceStats.totalServices} label={t('Service Cards', 'بطاقات الخدمة')} sub={t('Documented in the guide', 'خدمة موثّقة في الدليل')} color={TEAL_DEEP} iconEl={<IconClipboard color="#fff" size={20} />} />
              <HeroStatCard value={serviceStats.totalGroups} label={t('Service Groups', 'مجموعات الخدمة')} sub={t('Main service groups', 'مجموعة خدمية رئيسية')} color={TEAL} iconEl={<IconFolder color="#fff" size={20} />} />
              <HeroStatCard value={allRoles.length} label={t('Platform Roles', 'أدوار المنصة')} sub={t('Roles across the platform', 'دوراً على المنصة')} color="#1E5A9C" iconEl={<IconUsers color="#fff" size={20} />} />
              <HeroStatCard value={aiModelCount} label={t('AI Models', 'نماذج الذكاء الاصطناعي')} sub={t('AI models in service', 'نموذج ذكاء اصطناعي مفعّل')} color="#6A54A6" iconEl={<IconCpu color="#fff" size={20} />} />
              <HeroStatCard value={serviceStats.activeServices} label={t('Active on Platform', 'مفعّلة على المنصة')} sub={t('Fully active services', 'خدمة مفعّلة بالكامل')} color="#2F7D4F" iconEl={<IconCheck color="#fff" size={20} />} />
              <HeroStatCard value={serviceStats.newServices} label={t('New Services', 'خدمات جديدة')} sub={t('Newly added services', 'خدمة مضافة حديثاً')} color="#A9740F" iconEl={<IconSparkle color="#fff" size={20} />} />
            </div>

            {/* Coverage Donut + Group Bar Chart side by side */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
              {/* Donut Chart */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, flex: '1 1 300px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{t('Service Coverage', 'تغطية الخدمات')}</div>
                <div style={{
                  width: 200, height: 200, borderRadius: '50%', margin: '0 auto',
                  background: `conic-gradient(#059669 0deg ${(serviceStats.activeServices / serviceStats.totalServices) * 360}deg, #d97706 ${(serviceStats.activeServices / serviceStats.totalServices) * 360}deg ${((serviceStats.activeServices + serviceStats.partialServices) / serviceStats.totalServices) * 360}deg, #dc2626 ${((serviceStats.activeServices + serviceStats.partialServices) / serviceStats.totalServices) * 360}deg 360deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  <div style={{ width: 130, height: 130, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{coverageRate}%</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{t('Coverage', 'التغطية')}</span>
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                  {[{ l: t('Active', 'مفعّل'), c: '#059669', v: serviceStats.activeServices }, { l: t('Partial', 'جزئي'), c: '#d97706', v: serviceStats.partialServices }, { l: t('Gap', 'فجوة'), c: '#dc2626', v: serviceStats.gapServices }].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: x.c }} />
                      <span style={{ color: '#64748b' }}>{x.l} ({x.v})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, flex: '2 1 500px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Services per Group', 'الخدمات حسب المجموعة')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedGroups.map(g => {
                    const maxCount = Math.max(...serviceGroups.map(x => x.services.length));
                    return (
                      <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 160, fontSize: 12, color: '#334155', fontWeight: 500, textAlign: isRTL ? 'right' : 'left', flexShrink: 0 }}>
                          {gn(g)}
                        </div>
                        <div style={{ flex: 1, height: 22, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(g.services.length / maxCount) * 100}%`, height: '100%',
                            background: gcHex(g.color), borderRadius: 6, transition: 'width 0.5s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInlineEnd: 8,
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{g.services.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Findings */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #059669' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconChart color="#059669" size={18} /> {t('Coverage Rate', 'معدل التغطية')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginBottom: 8 }}>{coverageRate}%</div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                  <div style={{ width: `${coverageRate}%`, height: '100%', background: '#059669', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{t(`${serviceStats.activeServices} of ${serviceStats.totalServices} services fully active`, `${serviceStats.activeServices} من ${serviceStats.totalServices} خدمة مفعّلة بالكامل`)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #6366f1' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconShuffle color="#6366f1" size={18} /> {t('IA Consolidation', 'الدمج والتوحيد')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1', marginBottom: 8 }}>5</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t('Major route consolidations unifying 12+ paths into 5 canonical pages', 'عمليات دمج رئيسية توحّد 12+ مساراً في 5 صفحات أساسية')}</div>
              </div>
              <div style={{ flex: 1, minWidth: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, borderTop: '4px solid #9333ea' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconCpu color="#9333ea" size={18} /> {t('AI Integration', 'تكامل الذكاء الاصطناعي')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#9333ea', marginBottom: 8 }}>{aiModelCount}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t('AI models powering platform intelligence across services', 'نموذج ذكاء اصطناعي يعمل عبر خدمات المنصة')}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: PLATFORM MAP (mind map) ═══════════════ */}
        {activeTab === 'map' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <PlatformMindMap
              isRTL={isRTL}
              t={t}
              onOpenGroup={code => { setSelectedGroup(code); setStatusFilter('all'); setSearchQuery(''); setActiveTab('services'); }}
              onOpenRole={role => { setSelectedRole(role); setActiveTab('roles'); }}
              onOpenTab={tab => setActiveTab(tab as TabKey)}
            />
          </div>
        )}

        {/* ═══════════════ TAB 2: SERVICE CARDS ═══════════════ */}
        {activeTab === 'services' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <StatCard small value={serviceStats.totalServices} label={t('Total', 'الإجمالي')} color={TEAL} />
              <StatCard small value={serviceStats.activeServices} label={t('Active', 'مفعّل')} color="#059669" />
              <StatCard small value={serviceStats.partialServices} label={t('Partial', 'جزئي')} color="#d97706" />
              <StatCard small value={serviceStats.gapServices} label={t('Gap', 'فجوة')} color="#dc2626" />
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { key: 'all', en: 'All', ar: 'الكل' },
                { key: 'active', en: 'Active', ar: 'مفعّل' },
                { key: 'partial', en: 'Partial', ar: 'جزئي' },
                { key: 'gap', en: 'Gap', ar: 'فجوة' },
                { key: 'new', en: 'New', ar: 'جديد' },
                { key: 'correction', en: 'Correction', ar: 'تصحيح' },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: statusFilter === f.key ? TEAL : '#fff',
                    color: statusFilter === f.key ? '#fff' : '#64748b',
                  }}>{t(f.en, f.ar)}</button>
              ))}
              <input placeholder={t('Search services...', 'بحث في الخدمات...')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, flex: '1 1 200px', minWidth: 200 }} />
            </div>

            {/* Sidebar + Grid */}
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Sidebar */}
              <div style={{ width: 250, flexShrink: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
                    {t('SERVICE GROUPS', 'مجموعات الخدمات')}
                  </div>
                  <div onClick={() => setSelectedGroup(null)}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: selectedGroup === null ? 700 : 500, background: selectedGroup === null ? TEAL_LIGHT : 'transparent', color: selectedGroup === null ? TEAL : '#334155', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('All Services', 'جميع الخدمات')}</span>
                    <span style={{ fontSize: 11, background: '#e2e8f0', borderRadius: 10, padding: '2px 8px' }}>{allServices.length}</span>
                  </div>
                  {serviceGroups.map(g => (
                    <div key={g.code} onClick={() => setSelectedGroup(g.code)}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedGroup === g.code ? 700 : 400, background: selectedGroup === g.code ? `${gcHex(g.color)}12` : 'transparent', color: selectedGroup === g.code ? gcHex(g.color) : '#334155', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: gcHex(g.color), flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gn(g)}</span>
                      </div>
                      <span style={{ fontSize: 10, background: `${gcHex(g.color)}18`, color: gcHex(g.color), borderRadius: 10, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>{g.services.length}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{t(`Showing ${filteredServices.length} services`, `عرض ${filteredServices.length} خدمة`)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 14 }}>
                  {filteredServices.map(s => {
                    const grp = groupByCode(s.groupCode);
                    const color = grp?.color || '#64748b';
                    const st = sm(s);
                    return (
                      <div key={s.code} onClick={() => setSelectedService(s)}
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.15s', borderTop: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}12`, borderRadius: 6, padding: '3px 8px' }}>{s.code}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 10, padding: '2px 8px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          {s.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 10, padding: '2px 8px' }}>{t('New', 'جديد')}</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6, lineHeight: 1.5 }}>{sn(s)}</div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sd(s)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
                          <span><IconUsers color="#94a3b8" size={14} /> {s.platformRoles?.length || 0} {t('roles', 'أدوار')}</span>
                          {s.aiModel && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconCpu color="#94a3b8" size={14} /> {t('AI', 'ذكاء اصطناعي')}</span>}
                          <span style={{ marginInlineStart: 'auto', fontSize: 11, color: '#94a3b8' }}>{t('View details →', 'عرض التفاصيل ←')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detail Drawer */}
            {selectedService && (() => {
              const s = selectedService;
              const grp = groupByCode(s.groupCode);
              const color = grp?.color || '#64748b';
              const st = sm(s);
              return (
                <>
                  <div onClick={() => setSelectedService(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, animation: 'fadeIn 0.2s' }} />
                  <div style={{
                    position: 'fixed', top: 0, [isRTL ? 'left' : 'right']: 0, width: 560, maxWidth: '90vw', height: '100vh', background: '#fff', zIndex: 1001, overflowY: 'auto',
                    boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', animation: isRTL ? 'slideInLeft 0.3s' : 'slideInRight 0.3s',
                  }}>
                    {/* Drawer header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: `${color}08`, position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}15`, borderRadius: 8, padding: '4px 10px' }}>{s.code}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 10, padding: '3px 10px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          {s.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 10, padding: '2px 8px' }}>{t('New', 'جديد')}</span>}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.5 }}>{sn(s)}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</div>
                      </div>
                      <button onClick={() => setSelectedService(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <div style={{ padding: '20px 24px 40px' }}>
                      <Section title={t('Overview', 'نظرة عامة')}>
                        <Field label={t('Description', 'الوصف')} value={tf(s.description, s.descriptionEN)} />
                        <Field label={t('Goal', 'الهدف')} value={tf(s.goal, s.goalEN)} />
                      </Section>
                      <Section title={t('Target & Requirements', 'الفئة المستهدفة والمتطلبات')}>
                        <Field label={t('Target Audience', 'الفئة المستهدفة')} value={tf(s.target, s.targetEN)} />
                        <Field label={t('Conditions', 'الشروط')} value={tf(s.conditions, s.conditionsEN)} />
                        <Field label={t('Required Documents', 'المستندات المطلوبة')} value={tf(s.documents, s.documentsEN)} />
                      </Section>
                      {s.steps?.length > 0 && (
                        <Section title={t('Steps', 'الخطوات')}>
                          {(isRTL ? s.steps : (s.stepsEN || s.steps)).map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < s.steps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                            </div>
                          ))}
                        </Section>
                      )}
                      <Section title={t('Delivery', 'آلية التقديم')}>
                        <Field label={t('Channels', 'القنوات')} value={tf(s.channels, s.channelsEN)} />
                        <Field label={t('Duration', 'المدة')} value={tf(s.duration, s.durationEN)} />
                        <Field label={t('Fees', 'الرسوم')} value={tf(s.fees, s.feesEN)} />
                      </Section>
                      <Section title={t('Outcomes', 'المخرجات')}>
                        <Field label={t('Outputs', 'المخرجات')} value={tf(s.outputs, s.outputsEN)} />
                        <Field label={t('Limitations', 'القيود')} value={tf(s.limitations, s.limitationsEN)} />
                      </Section>
                      <Section title={t('Stakeholders', 'أصحاب المصلحة')}>
                        <Field label={t('Partners', 'الشركاء')} value={tf(s.partners, s.partnersEN)} />
                        <Field label={t('KPIs', 'مؤشرات الأداء')} value={tf(s.kpis, s.kpisEN)} />
                      </Section>
                      {/* AI & Intelligence */}
                      {s.aiModel && (
                        <Section title={t('AI & Intelligence', 'الذكاء الاصطناعي والتحليل')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                            <IconCpu color="#9333ea" size={28} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#9333ea' }}>{t('AI Model', 'النموذج الذكي')}</div>
                              <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{tf(s.aiModel, s.aiModelEN)}</div>
                            </div>
                          </div>
                        </Section>
                      )}
                      {/* Authorized Roles */}
                      {s.platformRoles?.length > 0 && (
                        <Section title={t('Authorized Roles', 'الأدوار المخوّلة')}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {s.platformRoles.map(r => {
                              const rl = roleLabels[r];
                              return (
                                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: TEAL_LIGHT, border: '1px solid #a7f3d0', borderRadius: 10, fontSize: 12, color: '' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: TEAL, color: '#fff', fontSize: 10, fontWeight: 700 }}>{(rl?.en || r).charAt(0)}</span>
                                  <span style={{ fontWeight: 600 }}>{rl ? t(rl.en, rl.ar) : r}</span>
                                </div>
                              );
                            })}
                          </div>
                        </Section>
                      )}
                      {/* Platform Integration */}
                      <Section title={t('Platform Integration', 'التكامل مع المنصة')}>
                        <div style={{ background: st.bg, border: `1px solid ${st.color}30`, borderRadius: 10, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, boxShadow: `0 0 6px ${st.color}60` }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          </div>
                          {s.platformPath && <Field label={t('Path', 'مسار')} value={s.platformPath} />}
                          {s.relatedForms && <Field label={t('Related Forms', 'النماذج المرتبطة')} value={s.relatedForms} />}
                          {s.gapNotes && (
                            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 6 }}>
                              <span style={{ fontWeight: 600 }}>{t('Notes:', 'ملاحظات:')}</span> {tf(s.gapNotes, s.gapNotesEN)}
                            </div>
                          )}
                        </div>
                      </Section>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ TAB 3: ROLES & RESPONSIBILITIES ═══════════════ */}
        {activeTab === 'roles' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Platform Roles', 'أدوار المنصة')} ({allRoles.length})</div>

            {/* Role Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
              {allRoles.map(role => {
                const rl = roleLabels[role];
                const count = roleServiceMap[role]?.length || 0;
                const selected = selectedRole === role;
                return (
                  <div key={role} onClick={() => setSelectedRole(selected ? null : role)}
                    style={{
                      background: selected ? TEAL_LIGHT : '#fff', border: selected ? `2px solid ${TEAL}` : '1px solid #e2e8f0',
                      borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: TEAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 20, fontWeight: 800, color: TEAL }}>{(rl?.en || role).charAt(0)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{rl ? t(rl.en, rl.ar) : role}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10, minHeight: 36 }}>{rl ? t(rl.descEN, rl.descAR) : ''}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, background: TEAL_LIGHT, borderRadius: 10, padding: '3px 10px' }}>{count} {t('services', 'خدمة')}</span>
                  </div>
                );
              })}
            </div>

            {/* Selected Role → Services */}
            {selectedRole && (() => {
              const rl = roleLabels[selectedRole];
              const services = roleServiceMap[selectedRole] || [];
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 18px', background: TEAL_LIGHT, borderRadius: 12, border: '1px solid #a7f3d0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: TEAL_LIGHT, color: TEAL, fontSize: 16, fontWeight: 800 }}>{(rl?.en || selectedRole).charAt(0)}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: TEAL }}>{rl ? t(rl.en, rl.ar) : selectedRole}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{t(`${services.length} services accessible`, `${services.length} خدمة متاحة`)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {services.map(s => {
                      const grp = groupByCode(s.groupCode);
                      const st = sm(s);
                      return (
                        <div key={s.code} onClick={() => { setActiveTab('services'); setSelectedService(s); }}
                          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, cursor: 'pointer', borderInlineStart: `3px solid ${grp?.color || '#64748b'}` }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: grp?.color, background: `${grp?.color}12`, borderRadius: 6, padding: '2px 6px' }}>{s.code}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 8, padding: '2px 6px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{sn(s)}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Role-Service Heatmap Matrix */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, overflowX: 'auto' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{t('Role-Service Access Matrix', 'مصفوفة وصول الأدوار للخدمات')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, position: 'sticky', insetInlineStart: 0, background: '#fff', minWidth: 140 }}>{t('Role', 'الدور')}</th>
                    {serviceGroups.map(g => (
                      <th key={g.code} style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: gcHex(g.color), fontWeight: 700, fontSize: 10, writingMode: 'vertical-rl', height: 80 }}>{g.code}</th>
                    ))}
                    <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>{t('Total', 'المجموع')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allRoles.map(role => {
                    const rl = roleLabels[role];
                    const roleSvcs = roleServiceMap[role] || [];
                    return (
                      <tr key={role} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155', position: 'sticky', insetInlineStart: 0, background: 'inherit', whiteSpace: 'nowrap' }}>
                          {(rl?.en || role).charAt(0)} {rl ? t(rl.en, rl.ar) : role}
                        </td>
                        {serviceGroups.map(g => {
                          const count = roleSvcs.filter(s => s.groupCode === g.code).length;
                          const opacity = count === 0 ? 0 : Math.min(0.15 + count * 0.25, 0.8);
                          return (
                            <td key={g.code} style={{ padding: 4, textAlign: 'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 6, margin: '0 auto',
                                background: count > 0 ? gcHex(g.color) : '#f1f5f9', opacity: count > 0 ? opacity : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: count > 0 ? '#fff' : '#cbd5e1', fontWeight: 700, fontSize: 11,
                              }}>{count || '·'}</div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: TEAL }}>{roleSvcs.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 4: GAP ANALYSIS MATRIX ═══════════════ */}
        {activeTab === 'gap' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { label: t('Active', 'مفعّل'), value: serviceStats.activeServices, total: serviceStats.totalServices, color: '#059669' },
                { label: t('Partial', 'جزئي'), value: serviceStats.partialServices, total: serviceStats.totalServices, color: '#d97706' },
                { label: t('Gap', 'فجوة'), value: serviceStats.gapServices, total: serviceStats.totalServices, color: '#dc2626' },
              ].map(x => (
                <div key={x.label} style={{ flex: 1, minWidth: 200, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, borderInlineStart: `4px solid ${x.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{x.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: x.color, margin: '4px 0' }}>{x.value}</div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ width: `${(x.value / x.total) * 100}%`, height: '100%', background: x.color, borderRadius: 3, minWidth: x.value > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{((x.value / x.total) * 100).toFixed(1)}% {t('of total', 'من الإجمالي')}</div>
                </div>
              ))}
            </div>

            {/* Service-Platform Mapping Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, overflowX: 'auto', marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{t('Service-Platform Mapping', 'مصفوفة ربط الخدمات بالمنصة')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Code', 'الرمز')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Service Name', 'اسم الخدمة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Group', 'المجموعة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Status', 'الحالة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Platform Path', 'مسار المنصة')}</th>
                    <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{t('Notes', 'ملاحظات')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allServices.map(s => {
                    const st = sm(s);
                    return (
                      <tr key={s.code} style={{ borderBottom: '1px solid #f1f5f9', background: `${st.bg}40` }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${st.bg}80`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${st.bg}40`; }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: groupByCode(s.groupCode)?.color }}>{s.code}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500, color: '#0f172a', maxWidth: 200 }}>{sn(s)}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 11 }}>{tf(s.group, serviceGroups.find(g => g.code === s.groupCode)?.nameEN || s.group)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 10, padding: '3px 10px' }}>{isRTL ? st.labelAR : st.labelEN}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <code style={{ fontSize: 11, color: '#334155', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{s.platformPath}</code>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tf(s.gapNotes, s.gapNotesEN)}>{tf(s.gapNotes, s.gapNotesEN) || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* IA Consolidation Report */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><IconShuffle color="#6366f1" size={20} /> {t('IA Consolidation Report', 'تقرير الدمج والتوحيد')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {consolidations.map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, borderTop: '3px solid #6366f1' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{t(c.title, c.titleAR)}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{t('Canonical route:', 'المسار الأساسي:')}</div>
                    <code style={{ fontSize: 12, color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{c.canonical}</code>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 12, marginBottom: 6 }}>{t('Merged routes:', 'المسارات المدمجة:')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.routes.map(r => (
                        <code key={r} style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, textDecoration: 'line-through' }}>{r}</code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Model Coverage */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><IconCpu color="#9333ea" size={20} /> {t('AI Model Coverage', 'تغطية نماذج الذكاء الاصطناعي')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 10 }}>
                {allServices.map(s => (
                  <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: s.aiModel ? '#faf5ff' : '#f8fafc', border: `1px solid ${s.aiModel ? '#e9d5ff' : '#e2e8f0'}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: groupByCode(s.groupCode)?.color, minWidth: 45 }}>{s.code}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sn(s)}</div>
                      <div style={{ fontSize: 11, color: s.aiModel ? '#9333ea' : '#cbd5e1', fontWeight: s.aiModel ? 500 : 400 }}>
                        {s.aiModel ? tf(s.aiModel, s.aiModelEN) : t('No AI model', 'لا يوجد نموذج ذكي')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default ServiceCatalog;
