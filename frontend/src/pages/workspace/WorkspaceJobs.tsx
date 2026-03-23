import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Briefcase, Plus, Search, Filter, MapPin, Clock, Users as UsersIcon,
  Loader2, ExternalLink, AlertCircle, CheckCircle, PauseCircle
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
};

interface WorkspaceContext { workspace: any; companyId: string; }

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: React.FC<any> }> = {
  published: { bg: brand.green, color: brand.greenText, label: 'Active', icon: CheckCircle },
  active: { bg: brand.green, color: brand.greenText, label: 'Active', icon: CheckCircle },
  draft: { bg: '#F3F4F6', color: '#374151', label: 'Draft', icon: PauseCircle },
  paused: { bg: brand.amber, color: brand.amberText, label: 'Paused', icon: PauseCircle },
  closed: { bg: brand.red, color: brand.redText, label: 'Closed', icon: AlertCircle },
};

const WorkspaceJobs: React.FC = () => {
  const { workspace, companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/hr/jobs`);
        const data = (res as any).data;
        setJobs(data.jobs || data.data || []);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyId]);

  const filtered = jobs.filter(j =>
    !searchQuery ||
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Job Postings', 'إعلانات الوظائف')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t(`Manage job postings for ${workspace?.company_name || 'your company'}`,
               `إدارة إعلانات الوظائف لـ ${workspace?.company_name || 'شركتك'}`)}
          </p>
        </div>
        <button
          onClick={() => navigate('/recruiter/jd-builder')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: brand.primary, color: brand.white, fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus size={16} />
          {t('Post New Job', 'نشر وظيفة جديدة')}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
        padding: '10px 14px',
      }}>
        <Search size={16} style={{ color: brand.textSecondary }} />
        <input
          type="text"
          placeholder={t('Search jobs by title or department...', 'ابحث عن وظائف حسب العنوان أو القسم...')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13,
            color: brand.textPrimary, background: 'transparent',
          }}
        />
      </div>

      {/* Jobs List */}
      {filtered.length === 0 ? (
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 48, textAlign: 'center',
        }}>
          <Briefcase size={36} style={{ color: brand.textSecondary, margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>
            {t('No jobs found', 'لم يتم العثور على وظائف')}
          </h3>
          <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 16 }}>
            {searchQuery
              ? t('Try adjusting your search terms.', 'حاول تعديل كلمات البحث.')
              : t('Create your first job posting to start attracting candidates.', 'أنشئ أول إعلان وظيفي لبدء جذب المرشحين.')}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/recruiter/jd-builder')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: brand.primary, color: brand.white, fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {t('Post a Job', 'نشر وظيفة')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((job, i) => {
            const status = statusConfig[job.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <div key={job.id || i} style={{
                background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
                padding: 18, display: 'flex', alignItems: 'center', gap: 16,
                transition: 'box-shadow 0.15s', cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: brand.primarySurface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Briefcase size={20} style={{ color: brand.primary }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                    {job.title || 'Untitled Position'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {job.department && (
                      <span style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Filter size={12} /> {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {job.location}
                      </span>
                    )}
                    {job.created_at && (
                      <span style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Applicants */}
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary }}>
                    {job.applicants_count || job.applications_count || 0}
                  </div>
                  <div style={{ fontSize: 11, color: brand.textSecondary }}>
                    {t('Applicants', 'المتقدمين')}
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: status.bg, color: status.color,
                }}>
                  <StatusIcon size={14} />
                  {t(status.label, status.label)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkspaceJobs;
