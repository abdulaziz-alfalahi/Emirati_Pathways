/**
 * Intelligence API Service
 * Frontend client for the platform intelligence backbone.
 * Connects to: /api/intelligence/*
 */

const API_BASE = ''; // Use relative URL through Vite proxy (backend on port 5005)

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `API error: ${res.status}`);
    }
    return res.json();
}

// ═══════════════════════════════════════════
// SKILL GRAPH
// ═══════════════════════════════════════════

export interface SkillTaxonomyItem {
    skill_id: string;
    name: string;
    name_ar: string;
    domain: string;
    category: string;
    demand_level: string;
    demand_score: number;
}

export interface UserSkill {
    skill_id: string;
    skill_name: string;
    proficiency: string;
    source: string;
    verified: boolean;
    evidence: string;
    domain?: string;
    category?: string;
    demand_score?: number;
}

export interface SkillGap {
    skill_id: string;
    skill_name: string;
    current_level: string | null;
    required_level: string;
    gap_score: number;
    priority: number;
    domain: string;
    bridging_actions: Array<{
        type: string;
        action: string;
        action_ar: string;
        effort: string;
    }>;
}

export interface GapAnalysis {
    user_id: number;
    target_role: string;
    total_required: number;
    skills_met: number;
    gaps_found: number;
    readiness_score: number;
    gaps: SkillGap[];
    analyzed_at: string;
}

export const skillGraphAPI = {
    getTaxonomy: (domain?: string) =>
        apiFetch<{ skills: SkillTaxonomyItem[]; total: number }>(
            `/api/intelligence/taxonomy${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`
        ),

    getUserSkills: () =>
        apiFetch<{ user_id: number; skills: UserSkill[]; total: number }>(
            '/api/intelligence/skills'
        ),

    addSkill: (data: { skill_id: string; skill_name: string; proficiency: string; source?: string }) =>
        apiFetch('/api/intelligence/skills', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    ingestCVSkills: (parsedCV: { skills: string[] }) =>
        apiFetch<{ ingested: number; skills: any[] }>('/api/intelligence/skills/ingest-cv', {
            method: 'POST',
            body: JSON.stringify(parsedCV),
        }),

    updateFromTraining: (courseName: string, skills: string[], proficiency?: string) =>
        apiFetch('/api/intelligence/skills/update-from-training', {
            method: 'POST',
            body: JSON.stringify({ course_name: courseName, skills, proficiency }),
        }),

    updateFromCertification: (certName: string, skills: string[], proficiency?: string) =>
        apiFetch('/api/intelligence/skills/update-from-certification', {
            method: 'POST',
            body: JSON.stringify({ cert_name: certName, skills, proficiency }),
        }),

    analyzeGaps: (targetRoleId?: string, targetSkills?: any[]) =>
        apiFetch<GapAnalysis>('/api/intelligence/skill-gap-analysis', {
            method: 'POST',
            body: JSON.stringify({ target_role_id: targetRoleId, target_skills: targetSkills }),
        }),

    getMarketDemand: (domain?: string, limit?: number) =>
        apiFetch<{ skills: SkillTaxonomyItem[]; total: number }>(
            `/api/intelligence/market-demand?${new URLSearchParams({
                ...(domain ? { domain } : {}),
                ...(limit ? { limit: String(limit) } : {}),
            })}`
        ),
};

// ═══════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════

export interface Recommendation {
    id?: number;
    type: string;  // training, mentor, certification, advisory, job, community
    title: string;
    title_ar: string;
    description: string;
    description_ar?: string;
    gap_skill: string;
    priority: number;
    effort: string;
    action_url: string;
    provider?: string;
    level?: string;
    mentor_id?: number;
}

export interface RecommendationResponse {
    user_id: number;
    generated_at: string;
    gap_summary: {
        total_gaps: number;
        readiness_score: number;
        target_role: string;
    };
    recommendations: Recommendation[];
    quick_wins: Recommendation[];
    long_term: Recommendation[];
}

export const recommendationAPI = {
    getRecommendations: (type?: string, limit?: number) =>
        apiFetch<{ user_id: number; recommendations: Recommendation[] }>(
            `/api/intelligence/recommendations?${new URLSearchParams({
                ...(type ? { type } : {}),
                ...(limit ? { limit: String(limit) } : {}),
            })}`
        ),

    generateRecommendations: (gapAnalysis?: GapAnalysis, maxPerType?: number) =>
        apiFetch<RecommendationResponse>('/api/intelligence/recommendations/generate', {
            method: 'POST',
            body: JSON.stringify({ gap_analysis: gapAnalysis, max_per_type: maxPerType }),
        }),

    sendFeedback: (recommendationId: string, action: string, notes?: string) =>
        apiFetch(`/api/intelligence/recommendations/${recommendationId}/feedback`, {
            method: 'POST',
            body: JSON.stringify({ action, notes }),
        }),
};

// ═══════════════════════════════════════════
// CAREER LIFECYCLE
// ═══════════════════════════════════════════

export interface LifecycleStage {
    value: string;
    label: string;
    label_ar: string;
    order: number;
}

export interface Milestone {
    id: string;
    name: string;
    name_ar: string;
    completed: boolean;
}

export interface CareerStage {
    user_id: number;
    current_stage: string;
    stage_label: string;
    stage_label_ar: string;
    stage_order: number;
    entered_at: string | null;
    milestones_completed: number;
    total_milestones: number;
    progress_pct: number;
    milestones: Milestone[];
    next_stage: LifecycleStage | null;
    all_stages: LifecycleStage[];
}

export interface StageAction {
    action: string;
    action_ar: string;
    url: string;
    icon: string;
}

export const careerLifecycleAPI = {
    getStage: () =>
        apiFetch<CareerStage>('/api/intelligence/career-stage'),

    initializeStage: (role?: string) =>
        apiFetch('/api/intelligence/career-stage/initialize', {
            method: 'POST',
            body: JSON.stringify({ role }),
        }),

    completeMilestone: (milestoneId: string) =>
        apiFetch('/api/intelligence/career-stage/milestone', {
            method: 'POST',
            body: JSON.stringify({ milestone_id: milestoneId }),
        }),

    advanceStage: (stage: string) =>
        apiFetch('/api/intelligence/career-stage/advance', {
            method: 'POST',
            body: JSON.stringify({ stage }),
        }),

    getStageRecommendations: () =>
        apiFetch<{ user_id: number; recommendations: StageAction[] }>(
            '/api/intelligence/career-stage/recommendations'
        ),
};

// ═══════════════════════════════════════════
// PROFILE SNAPSHOT (Dashboard One-Call)
// ═══════════════════════════════════════════

export interface ProfileSnapshot {
    user_id: number;
    skills: {
        total: number;
        top_skills: UserSkill[];
        sources: Record<string, number>;
        verified_count: number;
    };
    gap_analysis: {
        readiness_score: number;
        target_role: string;
        total_required: number;
        skills_met: number;
        gaps_found: number;
        top_gaps: SkillGap[];
    };
    recommendations: {
        total: number;
        quick_wins: Recommendation[];
        top_priority: Recommendation[];
        by_type: Record<string, Recommendation[]>;
    };
    career_stage: CareerStage | Record<string, any>;
    ai_insight: { en: string; ar: string };
}

export interface RecommendedJob {
    id?: number;
    title: string;
    title_ar?: string;
    company: string;
    company_ar?: string;
    location: string;
    salary: string;
    match_score: number;
    type: string;
    skill_overlap?: number;
    source: 'live' | 'curated';
}

export const profileSnapshotAPI = {
    getSnapshot: () =>
        apiFetch<ProfileSnapshot>('/api/intelligence/profile-snapshot'),

    getRecommendedJobs: () =>
        apiFetch<{ user_id: number; jobs: RecommendedJob[]; total: number; source: string }>(
            '/api/intelligence/recommended-jobs'
        ),
};

// ═══════════════════════════════════════════
// COMBINED EXPORT
// ═══════════════════════════════════════════

export const intelligenceAPI = {
    skills: skillGraphAPI,
    recommendations: recommendationAPI,
    lifecycle: careerLifecycleAPI,
    snapshot: profileSnapshotAPI,
};

export default intelligenceAPI;
