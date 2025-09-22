
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Target, TrendingUp, AlertCircle, CheckCircle, Lightbulb, User } from 'lucide-react';

export const PersonalizedInsights: React.FC = () => {
  const [preferences, setPreferences] = useState({
    priority: 'salary', // salary, growth, balance, stability
    riskTolerance: 'medium', // low, medium, high
    careerStage: 'early', // early, mid, senior
    workStyle: 'hybrid' // remote, office, hybrid
  });

  const [showRecommendations, setShowRecommendations] = useState(false);

  const generateRecommendations = () => {
    setShowRecommendations(true);
  };

  const getPersonalizedRanking = () => {
    // This would be a more sophisticated algorithm in a real application
    const careers = [
      {
        name: 'Data Scientist',
        match: 92,
        reasons: ['High growth potential', 'Excellent salary prospects', 'Future-proof skills'],
        risks: ['Requires continuous learning', 'Competitive field'],
        opportunities: ['AI/ML boom', 'Cross-industry demand', 'Leadership paths']
      },
      {
        name: 'Software Engineer',
        match: 88,
        reasons: ['Strong job security', 'Remote work options', 'Diverse opportunities'],
        risks: ['Rapid technology changes', 'Potential burnout'],
        opportunities: ['Startup ecosystem', 'Consulting opportunities', 'Product development']
      },
      {
        name: 'UX Designer',
        match: 85,
        reasons: ['Creative fulfillment', 'Good work-life balance', 'Growing demand'],
        risks: ['Subjective feedback', 'Portfolio dependency'],
        opportunities: ['Digital transformation', 'User-centric design trend', 'Freelance potential']
      },
      {
        name: 'Product Manager',
        match: 82,
        reasons: ['Strategic impact', 'Leadership development', 'High earning potential'],
        risks: ['High responsibility', 'Complex stakeholder management'],
        opportunities: ['Executive pathway', 'Entrepreneurship', 'Industry expertise']
      }
    ];

    return careers;
  };

  const getCareerFitAnalysis = () => {
    return {
      strengths: [
        'Analytical thinking and problem-solving skills',
        'Strong communication and collaboration abilities',
        'Adaptability to new technologies and trends',
        'Strategic mindset with attention to detail'
      ],
      developmentAreas: [
        'Leadership and team management experience',
        'Industry-specific technical skills',
        'Presentation and public speaking confidence',
        'Cross-functional project management'
      ],
      recommendations: [
        'Consider pursuing certifications in your chosen field',
        'Seek mentorship from senior professionals',
        'Build a portfolio of relevant projects',
        'Network within your target industry'
      ]
    };
  };

  const marketInsights = {
    trends: [
      {
        title: 'AI & Automation Impact',
        description: 'Careers requiring human creativity and complex problem-solving are growing',
        impact: 'positive'
      },
      {
        title: 'Remote Work Revolution',
        description: 'Flexible work arrangements are becoming standard across industries',
        impact: 'positive'
      },
      {
        title: 'Skills-Based Hiring',
        description: 'Employers increasingly value demonstrable skills over formal credentials',
        impact: 'neutral'
      },
      {
        title: 'Sustainability Focus',
        description: 'Green jobs and sustainable practices are creating new opportunities',
        impact: 'positive'
      }
    ],
    salaryProjections: {
      '2024': 100,
      '2025': 108,
      '2026': 116,
      '2027': 126,
      '2028': 136
    }
  };

  const careerFitAnalysis = getCareerFitAnalysis();

  return (
    <div className="space-y-6">
      {/* Preference Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-ehrdc-teal" />
            Personal Career Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Career Priorities */}
            <div>
              <h4 className="font-medium mb-3">What matters most to you?</h4>
              <RadioGroup value={preferences.priority} onValueChange={(value) => setPreferences(prev => ({ ...prev, priority: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="salary" id="salary" />
                  <Label htmlFor="salary">High Salary & Benefits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="growth" id="growth" />
                  <Label htmlFor="growth">Career Growth & Advancement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balance" id="balance" />
                  <Label htmlFor="balance">Work-Life Balance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stability" id="stability" />
                  <Label htmlFor="stability">Job Security & Stability</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Risk Tolerance */}
            <div>
              <h4 className="font-medium mb-3">Risk Tolerance</h4>
              <RadioGroup value={preferences.riskTolerance} onValueChange={(value) => setPreferences(prev => ({ ...prev, riskTolerance: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low-risk" />
                  <Label htmlFor="low-risk">Conservative (Stable, proven careers)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium-risk" />
                  <Label htmlFor="medium-risk">Moderate (Balanced growth & stability)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high-risk" />
                  <Label htmlFor="high-risk">Aggressive (High growth potential)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Career Stage */}
            <div>
              <h4 className="font-medium mb-3">Career Stage</h4>
              <RadioGroup value={preferences.careerStage} onValueChange={(value) => setPreferences(prev => ({ ...prev, careerStage: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="early" id="early-career" />
                  <Label htmlFor="early-career">Early Career (0-5 years)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mid" id="mid-career" />
                  <Label htmlFor="mid-career">Mid Career (5-15 years)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="senior" id="senior-career" />
                  <Label htmlFor="senior-career">Senior Career (15+ years)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Work Style */}
            <div>
              <h4 className="font-medium mb-3">Preferred Work Style</h4>
              <RadioGroup value={preferences.workStyle} onValueChange={(value) => setPreferences(prev => ({ ...prev, workStyle: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote-work" />
                  <Label htmlFor="remote-work">Fully Remote</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid-work" />
                  <Label htmlFor="hybrid-work">Hybrid (Remote + Office)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="office" id="office-work" />
                  <Label htmlFor="office-work">In-Office</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={generateRecommendations} className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
              <Target className="h-4 w-4 mr-2" />
              Generate Personalized Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-ehrdc-teal" />
              Your Personalized Career Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getPersonalizedRanking().map((career, index) => (
                <Card key={index} className={`border-l-4 ${index === 0 ? 'border-l-ehrdc-teal' : 'border-l-ehrdc-neutral-light'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          #{index + 1} {career.name}
                          {index === 0 && <Badge className="bg-ehrdc-teal">Best Match</Badge>}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-ehrdc-teal">{career.match}%</span>
                          <span className="text-sm text-muted-foreground">Compatibility</span>
                        </div>
                      </div>
                      <Progress value={career.match} className="w-24 h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Why It Fits
                        </h4>
                        <ul className="text-sm space-y-1">
                          {career.reasons.map((reason, i) => (
                            <li key={i} className="text-muted-foreground">• {reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Considerations
                        </h4>
                        <ul className="text-sm space-y-1">
                          {career.risks.map((risk, i) => (
                            <li key={i} className="text-muted-foreground">• {risk}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Opportunities
                        </h4>
                        <ul className="text-sm space-y-1">
                          {career.opportunities.map((opp, i) => (
                            <li key={i} className="text-muted-foreground">• {opp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Fit Analysis */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-ehrdc-teal" />
              Career Fit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Your Strengths
                </h4>
                <ul className="text-sm space-y-2">
                  {careerFitAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="text-muted-foreground">• {strength}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Development Areas
                </h4>
                <ul className="text-sm space-y-2">
                  {careerFitAnalysis.developmentAreas.map((area, i) => (
                    <li key={i} className="text-muted-foreground">• {area}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-ehrdc-teal mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Action Items
                </h4>
                <ul className="text-sm space-y-2">
                  {careerFitAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-muted-foreground">• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
            Market Trends & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketInsights.trends.map((trend, index) => (
              <Card key={index} className="border border-ehrdc-neutral-light">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      trend.impact === 'positive' ? 'bg-green-500' : 
                      trend.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <h4 className="font-medium mb-1">{trend.title}</h4>
                      <p className="text-sm text-muted-foreground">{trend.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
