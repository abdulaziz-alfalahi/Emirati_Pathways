import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Loader2, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { toast } from 'sonner';

interface InterviewScorecardProps {
  interviewId: string;
  interviewTitle?: string;
  onBack?: () => void;
}

interface Scorecard {
  id: number;
  interview_id: string;
  panelist_id: string;
  communication_score: number | null;
  technical_score: number | null;
  cultural_fit_score: number | null;
  leadership_score: number | null;
  overall_score: number | null;
  notes: string;
  recommendation: string;
  panelist_first_name?: string;
  panelist_last_name?: string;
  panelist_email?: string;
  created_at: string;
}

interface Aggregation {
  avg_communication: number;
  avg_technical: number;
  avg_cultural_fit: number;
  avg_leadership: number;
  avg_overall: number;
  total_scorecards: number;
}

const SCORE_CATEGORIES = [
  { key: 'communication_score', label: 'Communication', description: 'Clarity, articulation, and interpersonal skills' },
  { key: 'technical_score', label: 'Technical', description: 'Domain expertise and problem-solving ability' },
  { key: 'cultural_fit_score', label: 'Cultural Fit', description: 'Alignment with company values and team dynamics' },
  { key: 'leadership_score', label: 'Leadership', description: 'Initiative, decision-making, and team influence' },
  { key: 'overall_score', label: 'Overall', description: 'Overall impression and recommendation strength' },
];

const RECOMMENDATIONS = [
  { value: 'hire', label: '✅ Hire', color: 'bg-green-100 text-green-800' },
  { value: 'next_round', label: '➡️ Next Round', color: 'bg-blue-100 text-blue-800' },
  { value: 'hold', label: '⏸️ Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reject', label: '❌ Reject', color: 'bg-red-100 text-red-800' },
];

function StarRating({ value, onChange, readOnly = false }: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function InterviewScorecard({ interviewId, interviewTitle, onBack }: InterviewScorecardProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    communication_score: 0,
    technical_score: 0,
    cultural_fit_score: 0,
    leadership_score: 0,
    overall_score: 0,
  });
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [aggregation, setAggregation] = useState<Aggregation | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    fetchScorecards();
  }, [interviewId]);

  const fetchScorecards = async () => {
    try {
      setIsLoading(true);
      const res = await restClient.get(`/api/recruiter/interviews/${interviewId}/scorecards`);
      if (res.data?.success) {
        setScorecards(res.data.scorecards || []);
        setAggregation(res.data.aggregation || null);
      }
    } catch (error) {
      console.error('Failed to fetch scorecards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (field: string, value: number) => {
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate at least overall_score is provided
    if (scores.overall_score === 0) {
      toast.error('Please provide at least an overall score');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Record<string, any> = {
        notes,
        recommendation,
      };

      // Only include non-zero scores
      for (const [key, value] of Object.entries(scores)) {
        if (value > 0) {
          payload[key] = value;
        }
      }

      const res = await restClient.post(
        `/api/recruiter/interviews/${interviewId}/scorecard`,
        payload
      );

      if (res.data?.success) {
        toast.success('Scorecard submitted successfully');
        setHasSubmitted(true);
        fetchScorecards(); // Refresh aggregated view
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit scorecard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecommendationBadge = (rec: string) => {
    const found = RECOMMENDATIONS.find(r => r.value === rec);
    if (!found) return <Badge variant="outline">{rec}</Badge>;
    return <Badge className={found.color}>{found.label}</Badge>;
  };

  const getPanelistName = (sc: Scorecard) => {
    if (sc.panelist_first_name || sc.panelist_last_name) {
      return `${sc.panelist_first_name || ''} ${sc.panelist_last_name || ''}`.trim();
    }
    return sc.panelist_email || `Panelist ${sc.panelist_id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-ehrdc-teal hover:text-ehrdc-teal/80">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        <div>
          <h2 className="text-xl font-bold">Interview Scorecard</h2>
          {interviewTitle && (
            <p className="text-sm text-muted-foreground">{interviewTitle}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Your Assessment
            </CardTitle>
            <CardDescription>
              Rate the candidate on each dimension (1-5 stars)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {SCORE_CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">{category.label}</Label>
                  <span className="text-xs text-muted-foreground">
                    {scores[category.key] > 0 ? `${scores[category.key]}/5` : 'Not rated'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{category.description}</p>
                <StarRating
                  value={scores[category.key]}
                  onChange={(v) => handleScoreChange(category.key, v)}
                  readOnly={hasSubmitted}
                />
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t">
              <Label className="font-medium">Recommendation</Label>
              <Select value={recommendation} onValueChange={setRecommendation} disabled={hasSubmitted}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDATIONS.map((rec) => (
                    <SelectItem key={rec.value} value={rec.value}>
                      {rec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Notes</Label>
              <Textarea
                placeholder="Provide detailed notes on the candidate's strengths, areas of improvement, and any other observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                disabled={hasSubmitted}
              />
            </div>

            {hasSubmitted ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Scorecard submitted successfully</span>
              </div>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Scorecard'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right: Aggregated View */}
        <div className="space-y-4">
          {/* Aggregated Scores */}
          {aggregation && aggregation.total_scorecards > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Panel Summary
                </CardTitle>
                <CardDescription>
                  Averaged across {aggregation.total_scorecards} panelist{aggregation.total_scorecards !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SCORE_CATEGORIES.map((category) => {
                    const avgKey = `avg_${category.key.replace('_score', '')}` as keyof Aggregation;
                    const avgValue = aggregation[avgKey] || 0;
                    return (
                      <div key={category.key} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-2.5">
                            <div
                              className="bg-ehrdc-teal h-2.5 rounded-full transition-all"
                              style={{ width: `${(avgValue / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{avgValue.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Scorecards */}
          {isLoading ? (
            <div className="text-center p-8 text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
              Loading scorecards...
            </div>
          ) : scorecards.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Individual Scorecards ({scorecards.length})
              </h3>
              {scorecards.map((sc) => (
                <Card key={sc.id} className="border-l-4 border-l-purple-400">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{getPanelistName(sc)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sc.created_at).toLocaleString()}
                        </p>
                      </div>
                      {getRecommendationBadge(sc.recommendation)}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {SCORE_CATEGORIES.map((cat) => {
                        const val = sc[cat.key as keyof Scorecard] as number | null;
                        return (
                          <div key={cat.key} className="text-center">
                            <p className="text-xs text-muted-foreground truncate">{cat.label.slice(0, 5)}</p>
                            <p className="text-lg font-bold text-ehrdc-teal">{val ?? '-'}</p>
                          </div>
                        );
                      })}
                    </div>
                    {sc.notes && (
                      <p className="text-xs text-muted-foreground mt-2 border-t pt-2 line-clamp-2">
                        {sc.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No scorecards submitted yet.</p>
                <p className="text-xs">Be the first panelist to submit your assessment.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
