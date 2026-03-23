
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
  Award, Shield, Star, Target, Trophy, Users, Zap, Medal,
  BookOpen, Briefcase, GraduationCap, Globe, Loader2,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
  border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
  purple: '#F3E8FF', purpleText: '#6B21A8', gold: '#FEF3C7', goldText: '#92400E',
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  Explorer: <Star size={16} />, Achiever: <Target size={16} />,
  Professional: <Briefcase size={16} />, Expert: <Award size={16} />,
  Leader: <Shield size={16} />, Legend: <Trophy size={16} />,
};

const CATEGORY_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  education: { bg: brand.blue, color: brand.blueText, icon: <GraduationCap size={14} /> },
  training: { bg: brand.purple, color: brand.purpleText, icon: <BookOpen size={14} /> },
  employment: { bg: brand.green, color: brand.greenText, icon: <Briefcase size={14} /> },
  certification: { bg: brand.amber, color: brand.amberText, icon: <Award size={14} /> },
  community: { bg: brand.primarySurface, color: brand.primary, icon: <Users size={14} /> },
  leadership: { bg: brand.red, color: brand.redText, icon: <Shield size={14} /> },
  innovation: { bg: '#EDE9FE', color: '#5B21B6', icon: <Zap size={14} /> },
};

const CareerPassportPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<any>(null);
  const [stamps, setStamps] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const userId = user?.id || 1;
        const [pRes, sRes, lRes] = await Promise.allSettled([
          restClient.get(`/api/career-passport/passport?user_id=${userId}`),
          restClient.get(`/api/career-passport/stamps?user_id=${userId}`),
          restClient.get('/api/career-passport/leaderboard'),
        ]);
        if (cancelled) return;
        if (pRes.status === 'fulfilled') setPassport((pRes.value as any).data.passport);
        if (sRes.status === 'fulfilled') setStamps((sRes.value as any).data.stamps || []);
        if (lRes.status === 'fulfilled') setLeaderboard((lRes.value as any).data.leaderboard || []);
      } catch (e) { console.warn('Career passport API not available', e); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const categories = [...new Set(stamps.map(s => s.category))];
  const filtered = categoryFilter ? stamps.filter(s => s.category === categoryFilter) : stamps;
  const totalXp = passport?.total_xp || 0;
  const level = passport?.level || 'Explorer';

  /* ─── Tab 1: My Passport ─── */
  const passportTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('My Career Passport', 'جواز مسيرتي المهنية')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          'Your career passport tracks every milestone — education, training, employment, and leadership. Earn stamps to level up.',
          'جواز مسيرتك المهنية يتتبع كل إنجاز — التعليم، التدريب، التوظيف، والقيادة. اجمع الطوابع للترقية.'
        )}
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Level Card */}
          <div style={{ background: brand.primarySurface, borderRadius: 12, padding: 24, border: `1px solid ${brand.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#fff',
                border: `3px solid ${brand.primary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: brand.primary, fontSize: 24,
              }}>
                {LEVEL_ICONS[level] || <Star size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: '0 0 4px' }}>
                  {level}
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 8px' }}>
                  {totalXp} XP · {stamps.length} {t('stamps collected', 'طوابع مجمّعة')}
                </p>
                {/* Progress bar */}
                <div style={{ background: '#E5E7EB', borderRadius: 99, height: 8, width: '100%', overflow: 'hidden' }}>
                  <div style={{
                    background: brand.primary, height: '100%', borderRadius: 99,
                    width: `${Math.min((totalXp % 1000) / 10, 100)}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: brand.textSecondary, marginTop: 4, display: 'block' }}>
                  {1000 - (totalXp % 1000)} XP {t('to next level', 'لمستوى التالي')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ─── Tab 2: Digital Stamps ─── */
  const stampsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Digital Stamps', 'الطوابع الرقمية')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t(
          `You have earned ${stamps.length} stamps across ${categories.length} categories. Filter by category to explore.`,
          `لقد حصلت على ${stamps.length} طابع عبر ${categories.length} تصنيفات. استخدم الفلتر للاستكشاف.`
        )}
      </p>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setCategoryFilter('')} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: !categoryFilter ? brand.primary : '#fff',
          color: !categoryFilter ? '#fff' : brand.textSecondary,
          border: !categoryFilter ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
        }}>
          {t('All', 'الكل')}
        </button>
        {categories.map(c => {
          const catStyle = CATEGORY_STYLES[c] || { bg: '#F3F4F6', color: brand.textSecondary };
          return (
            <button key={c} onClick={() => setCategoryFilter(c)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: categoryFilter === c ? brand.primary : '#fff',
              color: categoryFilter === c ? '#fff' : brand.textSecondary,
              border: categoryFilter === c ? 'none' : `1px solid ${brand.border}`, cursor: 'pointer',
            }}>
              {c}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Medal size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No stamps yet — complete activities to earn your first stamp!', 'لا طوابع بعد — أكمل الأنشطة للحصول على أول طابع!')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((stamp, i) => {
            const catStyle = CATEGORY_STYLES[stamp.category] || { bg: '#F3F4F6', color: brand.textSecondary, icon: <Star size={14} /> };
            return (
              <div key={i} className="ep-card" style={{
                background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                padding: 18, transition: 'box-shadow .2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: catStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: catStyle.color,
                  }}>
                    {catStyle.icon}
                  </div>
                  <span style={{ background: brand.gold, color: brand.goldText, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                    +{stamp.xp_awarded || 50} XP
                  </span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                  {isRTL ? (stamp.title_ar || stamp.title) : stamp.title}
                </h4>
                <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 6 }}>
                  {stamp.category} · {stamp.earned_date ? new Date(stamp.earned_date).toLocaleDateString() : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Tab 3: Leaderboard ─── */
  const leaderboardTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Leaderboard', 'لوحة المتصدرين')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t('See how you rank against other Emirati professionals on the platform.', 'شاهد ترتيبك مقارنة بالمهنيين الإماراتيين الآخرين.')}
      </p>

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Trophy size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('Leaderboard is loading...', 'جاري تحميل لوحة المتصدرين...')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leaderboard.map((entry, i) => {
            const isMe = entry.user_id === (user?.id || 0);
            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: isMe ? brand.primarySurface : '#fff',
                border: `1px solid ${isMe ? brand.primary : brand.border}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: i < 3 ? medalColors[i] : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: i < 3 ? '#fff' : brand.textSecondary,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                    {entry.full_name || 'Anonymous'} {isMe && <span style={{ fontSize: 11, color: brand.primary }}>(you)</span>}
                  </span>
                  <div style={{ fontSize: 12, color: brand.textSecondary }}>
                    {entry.level} · {entry.stamp_count} {t('stamps', 'طوابع')}
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: brand.primary }}>
                  {entry.total_xp} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Layout ─── */
  const statsData = [
    { value: `${stamps.length}`, label: t('Stamps Earned', 'طوابع مكتسبة'), icon: Medal },
    { value: level, label: t('Current Level', 'المستوى الحالي'), icon: Shield },
    { value: `${totalXp}`, label: t('Total XP', 'إجمالي النقاط'), icon: Zap },
    { value: `${leaderboard.length}`, label: t('Participants', 'مشاركون'), icon: Users },
  ];

  const tabs = [
    { id: 'passport', label: t('My Passport', 'جوازي'), icon: <Shield className="h-4 w-4" />, content: passportTab },
    { id: 'stamps', label: t('Digital Stamps', 'الطوابع'), icon: <Medal className="h-4 w-4" />, content: stampsTab },
    { id: 'leaderboard', label: t('Leaderboard', 'المتصدرين'), icon: <Trophy className="h-4 w-4" />, content: leaderboardTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Passport', 'جواز المسيرة المهنية')}
      description={t(
        'Track your career milestones with digital stamps — education, training, certifications, and leadership. Level up your professional journey.',
        'تتبع إنجازاتك المهنية مع الطوابع الرقمية — التعليم والتدريب والشهادات والقيادة. ارتقِ بمسيرتك المهنية.'
      )}
      icon={<Award className="h-6 w-6" />}
      stats={statsData}
      tabs={tabs}
      defaultTab="passport"
      embedded={embedded}
    />
  );
};

export default CareerPassportPage;
