// src/components/cv-builder/CVScoringWidget.tsx

import React, { useState, useEffect } from 'react';
import { useCV } from '@/context/CVContext';

// Enhanced utilities (only the ones actually used)
import { generateCVSuggestions } from '@/utils/cv-utils';

// UAE data utilities (only the ones actually used)
import { UAE_HIGH_DEMAND_SKILLS } from '@/utils/uae-data';

// Type imports
import type { CVData, CVAnalytics } from '@/types/cv';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Users,
  DollarSign,
  Star,
  Zap,
  Globe,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface CVScoringWidgetProps {
  cvData?: Partial<CVData>;
  cvId?: string;
  showDetailedAnalysis?: boolean;
  className?: string;
}

interface ScoreBreakdown {
  section: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'missing';
  suggestions: string[];
}

export const CVScoringWidget: React.FC<CVScoringWidgetProps> = ({
  cvData,
  cvId,
  showDetailedAnalysis = true,
  className = '',
}) => {
  const { loading, getAnalytics, getCompletionScore } = useCV();

  // Local state
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown[]>([]);
  const [marketInsights, setMarketInsights] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<CVAnalytics | null>(null);

  useEffect(() => {
    // initial analytics fetch
    (async () => {
      try {
        const a = await getAnalytics(cvId);
        if (a) setAnalytics(a);
      } catch {
        // ignore (display zeros)
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId]);

  useEffect(() => {
    if (cvData) {
      calculateDetailedScore();
      generateMarketInsights();
      generateSuggestionsAndStrengths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData]);

  const calculateDetailedScore = () => {
    if (!cvData) return;

    const sections = [
      {
        section: 'Personal Information',
        data: cvData.personalInfo,
        weight: 15,
        requiredFields: ['firstName', 'lastName', 'email', 'phone', 'emirate', 'city'],
      },
      {
        section: 'Professional Summary',
        // In this schema, summary is stored on personalInfo.profileSummary
        data: cvData.personalInfo?.profileSummary,
        weight: 20,
        requiredFields: ['summary'],
      },
      {
        section: 'Work Experience',
        data: cvData.experience,
        weight: 30,
        // Our Experience shape uses jobTitle instead of position
        requiredFields: ['company', 'jobTitle', 'description'],
      },
      {
        section: 'Education',
        data: cvData.education,
        weight: 20,
        requiredFields: ['institution', 'degree', 'fieldOfStudy'],
      },
      {
        section: 'Skills',
        data: cvData.skills,
        weight: 10,
        requiredFields: ['name', 'level'],
      },
      {
        section: 'Languages',
        data: cvData.languages,
        weight: 5,
        requiredFields: ['name', 'proficiency'],
      },
    ] as const;

    const breakdown: ScoreBreakdown[] = sections.map((section) => {
      let score = 0;
      let status: ScoreBreakdown['status'] = 'missing';
      const sectionSuggestions: string[] = [];

      if (section.section === 'Personal Information' && section.data) {
        const personalInfo = section.data as Partial<CVData['personalInfo']>;
        const completedFields = section.requiredFields.filter((field) => (personalInfo as any)?.[field]);
        score = (completedFields.length / section.requiredFields.length) * section.weight;

        if (score >= section.weight * 0.9) status = 'excellent';
        else if (score >= section.weight * 0.7) status = 'good';
        else if (score > 0) status = 'needs_improvement';
        else status = 'missing';

        if (!personalInfo?.emiratesId) sectionSuggestions.push('Add Emirates ID if you are a UAE national.');
        if (!personalInfo?.linkedinUrl) sectionSuggestions.push('Add your LinkedIn profile URL.');
        if (!personalInfo?.arabicFirstName && !personalInfo?.arabicLastName) {
          sectionSuggestions.push('Consider adding your Arabic name.');
        }
      } else if (section.section === 'Professional Summary') {
        const summaryText = typeof section.data === 'string' ? section.data : '';
        if (summaryText && summaryText.length > 0) {
          if (summaryText.length >= 150) {
            score = section.weight;
            status = summaryText.length >= 200 ? 'excellent' : 'good';
          } else {
            score = section.weight * 0.5;
            status = 'needs_improvement';
            sectionSuggestions.push('Expand your professional summary (aim for 150–300 words).');
          }
        } else {
          status = 'missing';
          sectionSuggestions.push('Add a compelling professional summary.');
        }
      } else if (section.section === 'Work Experience' && Array.isArray(section.data)) {
        const experiences = section.data as any[];
        if (experiences.length > 0) {
          const avgCompleteness =
            experiences.reduce((acc, exp) => {
              const completed = section.requiredFields.filter((field) => !!exp?.[field]).length;
              return acc + completed / section.requiredFields.length;
            }, 0) / experiences.length;

          score = avgCompleteness * section.weight;

          if (score >= section.weight * 0.9) status = 'excellent';
          else if (score >= section.weight * 0.7) status = 'good';
          else status = 'needs_improvement';

          if (experiences.length < 2) sectionSuggestions.push('Add one more work experience if available.');
          if (experiences.some((exp) => !exp?.achievements || exp.achievements.length === 0)) {
            sectionSuggestions.push('Add measurable achievements to your experiences.');
          }
        } else {
          status = 'missing';
          sectionSuggestions.push('Add your work experience.');
        }
      } else if (Array.isArray(section.data)) {
        const items = section.data as any[];
        if (items.length > 0) {
          score = section.weight;
          status = items.length >= 3 ? 'excellent' : 'good';
        } else {
          status = 'missing';
          sectionSuggestions.push(`Add ${section.section.toLowerCase()}.`);
        }
      } else {
        status = 'missing';
        sectionSuggestions.push(`Add ${section.section.toLowerCase()}.`);
      }

      return {
        section: section.section,
        score,
        maxScore: section.weight,
        status,
        suggestions: sectionSuggestions,
      };
    });

    setScoreBreakdown(breakdown);
  };

  // Safe Y-M → Date conversion
  const ymToDate = (val?: string) => {
    if (!val || typeof val !== 'string') return undefined;
    const d = new Date(`${val}-01T00:00:00`);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const estimateSalaryRange = (data: Partial<CVData>) => {
    const experienceYears =
      data.experience?.reduce((total, exp) => {
        const start = ymToDate(exp.startDate);
        const end = exp.isCurrentlyWorking ? new Date() : ymToDate(exp.endDate) || ymToDate(exp.startDate);
        if (!start || !end) return total;
        const ms = Math.max(0, end.getTime() - start.getTime());
        const years = ms / (1000 * 60 * 60 * 24 * 365);
        return total + years;
      }, 0) || 0;

    const hasStrategicSkills =
      data.skills?.some((s) => UAE_HIGH_DEMAND_SKILLS.map((x) => x.toLowerCase()).includes(s.name.toLowerCase())) ||
      false;

    let base = 8000; // AED per month (very rough heuristic)
    if (experienceYears > 5) base = 15000;
    if (experienceYears > 10) base = 25000;
    if (hasStrategicSkills) base *= 1.3;

    const minSalary = Math.round(base * 0.8);
    const maxSalary = Math.round(base * 1.4);

    const f = (n: number) => n.toLocaleString('en-AE');
    return `AED ${f(minSalary)} - AED ${f(maxSalary)}`;
  };

  const getTrendingSkills = (data: Partial<CVData>) => {
    const userSkills = data.skills?.map((s) => s.name.toLowerCase()) || [];
    return UAE_HIGH_DEMAND_SKILLS.filter((skill) =>
      userSkills.some((u) => u.includes(skill.toLowerCase()) || skill.toLowerCase().includes(u))
    ).slice(0, 5);
  };

  const getCompetitiveAdvantages = (data: Partial<CVData>) => {
    const advantages: string[] = [];
    if (data.personalInfo?.emiratesId) advantages.push('UAE National');
    if ((data.languages?.length || 0) > 2) advantages.push('Multilingual');
    if (data.skills?.some((s) => s.level === 'Expert')) advantages.push('Expert Skills');
    if ((data.experience?.length || 0) > 3) advantages.push('Rich Experience');
    if (data.education?.some((e: any) => e?.degree?.includes?.('Master') || e?.degree?.includes?.('PhD'))) {
      advantages.push('Advanced Education');
    }
    return advantages;
  };

  const getImprovementAreas = (data: Partial<CVData>) => {
    const areas: string[] = [];
    const certs = data?.certifications;
    const projects = data?.projects;

    if (!certs || certs.length === 0) areas.push('Professional Certifications');
    if (!projects || projects.length === 0) areas.push('Portfolio Projects');
    if (!data.personalInfo?.linkedinUrl) areas.push('LinkedIn Profile');
    if (!data.skills || data.skills.length < 8) areas.push('More Skills');

    return areas;
  };

  const computeDemandScore = (data: Partial<CVData>) => {
    const userSkills = (data.skills || []).map((s) => s.name.toLowerCase());
    const high = UAE_HIGH_DEMAND_SKILLS.map((s) => s.toLowerCase());
    const matches = userSkills.filter((s) => high.some((h) => s.includes(h) || h.includes(s))).length;
    // Simple % of the 10-item high-demand list
    return Math.round((matches / high.length) * 100);
  };

  const generateMarketInsights = () => {
    if (!cvData) return;

    const insights = {
      demandScore: computeDemandScore(cvData),
      salaryRange: estimateSalaryRange(cvData),
      trendingSkills: getTrendingSkills(cvData),
      competitiveAdvantages: getCompetitiveAdvantages(cvData),
      improvementAreas: getImprovementAreas(cvData),
    };

    setMarketInsights(insights);
  };

  const getCVStrengthsLocal = (data: Partial<CVData>) => {
    const res: string[] = [];
    if (data.personalInfo?.profileSummary && data.personalInfo.profileSummary.length >= 150) {
      res.push('Strong professional summary');
    }
    if ((data.experience?.length || 0) >= 3) res.push('Solid work experience');
    if (data.skills && data.skills.some((s) => s.level === 'Expert')) res.push('Expert-level skills');
    const langs = (data.languages || []).map((l) => l.name.toLowerCase());
    if (langs.includes('arabic') && langs.includes('english')) res.push('Bilingual (Arabic & English)');
    if (marketInsights?.trendingSkills?.length) res.push('Trending in-demand skillset');
    return res;
    };

  const generateSuggestionsAndStrengths = () => {
    if (!cvData) return;

    const newSuggestions = generateCVSuggestions(cvData) || [];
    const newStrengths = getCVStrengthsLocal(cvData) || [];

    setSuggestions(newSuggestions);
    setStrengths(newStrengths);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: ScoreBreakdown['status']) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Work</Badge>;
      case 'missing':
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleRefreshAnalytics = async () => {
    try {
      const a = await getAnalytics(cvId);
      if (a) setAnalytics(a);
      // also refresh insights since cvData may have changed upstream
      generateMarketInsights();
      generateSuggestionsAndStrengths();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error refreshing analytics:', error);
    }
  };

  const safeCompletion = getCompletionScore();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              CV Score &amp; Analysis
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshAnalytics} disabled={loading.isLoading}>
              {loading.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Score */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-700 mb-2">{safeCompletion}%</div>
              <div className="text-sm text-blue-600 mb-4">CV Completion Score</div>
              <Progress value={safeCompletion} className="h-3" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{analytics?.views ?? 0}</div>
                <div className="text-xs text-gray-600">Profile Views</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{analytics?.downloads ?? 0}</div>
                <div className="text-xs text-gray-600">Downloads</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{analytics?.matches ?? 0}</div>
                <div className="text-xs text-gray-600">Job Matches</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{marketInsights?.demandScore ?? 0}%</div>
                <div className="text-xs text-gray-600">Market Demand</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      {showDetailedAnalysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 me-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="strengths">
              <Award className="h-4 w-4 me-2" />
              Strengths
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Lightbulb className="h-4 w-4 me-2" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="market">
              <TrendingUp className="h-4 w-4 me-2" />
              Market
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Section Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scoreBreakdown.map((section, index) => {
                    const pct = section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{section.section}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getScoreColor(section.score, section.maxScore)}`}>
                              {Math.round(pct)}%
                            </span>
                            {getStatusBadge(section.status)}
                          </div>
                        </div>
                        <Progress value={pct} className="h-2" />
                        {section.suggestions.length > 0 && (
                          <div className="text-xs text-gray-600 ms-2">💡 {section.suggestions[0]}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strengths Tab */}
          <TabsContent value="strengths" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Your CV Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strengths.length > 0 ? (
                  <div className="space-y-3">
                    {strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-800">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Complete more sections to see your CV strengths</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competitive Advantages */}
            {marketInsights?.competitiveAdvantages && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Competitive Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {marketInsights.competitiveAdvantages.map((advantage: string, index: number) => (
                      <Badge key={index} className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 me-1" />
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-green-600 font-medium">Excellent! Your CV looks great.</p>
                    <p className="text-gray-600 text-sm">No major improvements needed at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Improvement Areas */}
            {marketInsights?.improvementAreas && marketInsights.improvementAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {marketInsights.improvementAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Consider adding: {area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  UAE Market Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Salary Range */}
                {marketInsights?.salaryRange && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Expected Salary Range</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{marketInsights.salaryRange}</div>
                    <div className="text-sm text-green-600 mt-1">Based on your experience and skills in the UAE market</div>
                  </div>
                )}

                {/* Market Demand */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Market Demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={marketInsights?.demandScore || 0} className="flex-1 h-2" />
                    <span className="font-bold text-blue-700">{marketInsights?.demandScore || 0}%</span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">Demand for your profile in the UAE job market</div>
                </div>

                {/* Trending Skills */}
                {marketInsights?.trendingSkills && marketInsights.trendingSkills.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">Your Trending Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {marketInsights.trendingSkills.map((skill: string, index: number) => (
                        <Badge key={index} className="bg-purple-100 text-purple-800">
                          <TrendingUp className="h-3 w-3 me-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* UAE Strategic Framework Alignment (illustrative) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  D33 and Talent33 Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Digital Transformation</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20 h-2" />
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Innovation Leadership</span>
                    <div className="flex items-center gap-2">
                      <Progress value={60} className="w-20 h-2" />
                      <span className="text-sm font-medium">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cultural Intelligence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sustainability Focus</span>
                    <div className="flex items-center gap-2">
                      <Progress value={40} className="w-20 h-2" />
                      <span className="text-sm font-medium">40%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setActiveTab('suggestions')} disabled={loading.isLoading}>
          <Lightbulb className="h-4 w-4 me-2" />
          Get Suggestions
        </Button>

        <Button onClick={handleRefreshAnalytics} disabled={loading.isLoading}>
          {loading.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 me-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
