import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restClient } from '@/utils/api';
import { Card } from '@/components/ui/card';
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  Users,
  Check,
  ArrowRight,
  Flag,
} from 'lucide-react';

/**
 * "Your Journey" — a persona-aware view of where a candidate stands in the Emirati
 * career-development lifecycle. Shows the 4 lifecycle phases (as in the top nav) with
 * the current one highlighted, then the precise current stage (from the 8-stage engine),
 * progress within it, and the single next milestone.
 *
 * Data: GET /api/intelligence/career-stage (current_stage, stage_label[_ar], stage_order,
 * progress_pct, milestones[], milestones_completed/total). Readiness % is passed in from
 * the dashboard (which already fetches /api/v2/profile/readiness).
 *
 * Fails quietly (renders nothing) so it can never break the dashboard.
 */

type Phase = {
  key: string;
  label: [string, string];
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
  route: string;
  stages: string[]; // which of the 8 engine stages roll up into this phase
};

const PHASES: Phase[] = [
  { key: 'education', label: ['Education Pathway', 'مسار التعليم'], color: '#006E6D', Icon: GraduationCap, route: '/university-programs', stages: ['discovery', 'assessment', 'upskilling'] },
  { key: 'career', label: ['Career Entry', 'دخول المسار المهني'], color: '#0079C1', Icon: Briefcase, route: '/job-matching', stages: ['entry'] },
  { key: 'professional', label: ['Professional Growth', 'النمو المهني'], color: '#7B1FA2', Icon: TrendingUp, route: '/training', stages: ['growth', 'leadership'] },
  { key: 'lifelong', label: ['Lifelong Engagement', 'المشاركة مدى الحياة'], color: '#C62828', Icon: Users, route: '/mentorship', stages: ['entrepreneurship', 'legacy'] },
];

const STAGE_ORDER = ['discovery', 'assessment', 'upskilling', 'entry', 'growth', 'leadership', 'entrepreneurship', 'legacy'];

interface CareerJourneyProps {
  readinessScore?: number;
  isRTL?: boolean;
  t: (en: string, ar: string) => string;
}

const CareerJourney: React.FC<CareerJourneyProps> = ({ readinessScore = 0, isRTL = false, t }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    restClient
      .get('/api/intelligence/career-stage')
      .then((res) => { if (alive) setData(res.data?.data || res.data); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (failed) return null; // never break the dashboard

  if (loading) {
    return (
      <Card className="p-6 mb-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
        <div className="h-11 bg-slate-100 rounded-full mb-6" />
        <div className="h-20 bg-slate-100 rounded-xl" />
      </Card>
    );
  }

  const currentStage: string = data?.current_stage || 'discovery';
  const currentPhaseIdx = Math.max(0, PHASES.findIndex((p) => p.stages.includes(currentStage)));
  const phase = PHASES[currentPhaseIdx];
  const stageIndex = typeof data?.stage_order === 'number' ? data.stage_order : STAGE_ORDER.indexOf(currentStage);
  const stageNum = Math.max(1, stageIndex + 1);
  const progressPct = Math.min(100, Math.max(0, Number(data?.progress_pct) || 0));
  const milesDone = Number(data?.milestones_completed) || 0;
  const milesTotal = Number(data?.total_milestones) || (Array.isArray(data?.milestones) ? data.milestones.length : 0) || 0;
  const stageLabel = (isRTL ? data?.stage_label_ar : data?.stage_label) || phase.label[isRTL ? 1 : 0];
  const nextMilestone = (Array.isArray(data?.milestones) ? data.milestones : []).find((m: any) => !m.completed && !m.is_completed);
  const nextText = nextMilestone
    ? (isRTL ? (nextMilestone.name_ar || nextMilestone.name) : nextMilestone.name)
    : t('Explore what’s next in your journey', 'استكشف الخطوة التالية في رحلتك');

  // Rail geometry: markers are centered in 4 equal columns (centers at 12.5% … 87.5%).
  const fillPct = (currentPhaseIdx / (PHASES.length - 1)) * 75; // width from the 12.5% start

  const ready = Math.min(100, Math.max(0, Math.round(readinessScore || 0)));
  const R = 40;
  const C = 2 * Math.PI * R;

  return (
    <Card className="mb-6 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ ['--ph' as any]: phase.color }}>
      {/* header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: phase.color }}>
            {t('Emirati Career Development', 'تطوير المسار المهني الإماراتي')}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{t('Your Journey', 'رحلتك')}</h3>
        </div>
      </div>

      {/* 4-phase timeline */}
      <div className="px-6 pt-7">
        <div className="relative grid grid-cols-4">
          {/* rail + fill */}
          <div className="absolute top-[21px] h-[3px] rounded bg-slate-200" style={{ insetInlineStart: '12.5%', insetInlineEnd: '12.5%' }} />
          <div className="absolute top-[21px] h-[3px] rounded transition-[width] duration-500" style={{ insetInlineStart: '12.5%', width: `${fillPct}%`, background: phase.color }} />

          {PHASES.map((p, i) => {
            const state = i < currentPhaseIdx ? 'done' : i === currentPhaseIdx ? 'current' : 'upcoming';
            const Icon = p.Icon;
            return (
              <div key={p.key} className="relative flex flex-col items-center text-center gap-2.5 px-1.5">
                <div
                  className="w-11 h-11 rounded-full grid place-items-center z-[1] bg-white transition-all duration-300"
                  style={{
                    border: `3px solid ${state === 'upcoming' ? '#cbd5e1' : p.color}`,
                    background: state === 'done' ? p.color : '#fff',
                    color: state === 'done' ? '#fff' : state === 'current' ? p.color : '#94a3b8',
                    boxShadow: state === 'current' ? `0 0 0 5px ${p.color}22` : 'none',
                  }}
                >
                  {state === 'done' ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: state === 'done' ? '#1f8a54' : state === 'current' ? p.color : '#94a3b8' }}
                >
                  {state === 'done'
                    ? t('Complete', 'مكتمل')
                    : state === 'current'
                    ? t('You are here', 'أنت هنا')
                    : `${t('Phase', 'المرحلة')} ${i + 1}`}
                </div>
                <div className={`text-[13px] font-semibold leading-tight ${state === 'upcoming' ? 'text-slate-500' : 'text-slate-800'}`} style={{ textWrap: 'balance' } as any}>
                  {p.label[isRTL ? 1 : 0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* current-stage detail */}
      <div className="m-6 mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 sm:gap-7 items-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: phase.color }}>
            {phase.label[isRTL ? 1 : 0]} · {t('Stage', 'المرحلة')} {stageNum} {t('of', 'من')} 8
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stageLabel}</div>

          <div className="mt-3">
            <div className="h-[9px] rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${progressPct}%`, background: phase.color }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-slate-500">
              <span>
                {milesTotal > 0
                  ? `${milesDone} ${t('of', 'من')} ${milesTotal} ${t('milestones complete', 'إنجازات مكتملة')}`
                  : t('Just getting started', 'بداية الرحلة')}
              </span>
              <span className="tabular-nums"><b className="text-slate-800">{progressPct}</b>% {t('this stage', 'هذه المرحلة')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 text-[13.5px] text-slate-600">
            <span className="w-[30px] h-[30px] rounded-lg grid place-items-center flex-none" style={{ background: `${phase.color}1f`, color: phase.color }}>
              <Flag className="w-4 h-4" />
            </span>
            <span>{t('Next milestone', 'الإنجاز التالي')} — <b className="text-slate-800 font-semibold">{nextText}</b></span>
          </div>
        </div>

        <div className="grid place-items-center gap-2 justify-self-start sm:justify-self-auto">
          <div className="relative w-[92px] h-[92px]">
            <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
              <circle cx="46" cy="46" r={R} fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle cx="46" cy="46" r={R} fill="none" stroke={phase.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * ready) / 100} style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <b className="text-[23px] font-extrabold tabular-nums leading-none text-slate-900">{ready}</b>
              <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{t('Ready', 'الجاهزية')}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(phase.route)}
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white rounded-lg px-4 py-2.5 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: phase.color }}
          >
            {t('Continue', 'المتابعة')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default CareerJourney;
