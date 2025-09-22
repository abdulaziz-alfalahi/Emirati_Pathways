
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Zap,
  CheckCircle,
  Plus,
  Brain
} from 'lucide-react';

interface SmartSuggestionsProps {
  resumeData: any;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ resumeData }) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  const skillSuggestions = [
    { id: '1', skill: 'Digital Marketing', reason: 'High demand in UAE market', confidence: 95 },
    { id: '2', skill: 'Project Management', reason: 'Complements your experience', confidence: 88 },
    { id: '3', skill: 'Data Analysis', reason: 'Growing field requirement', confidence: 82 }
  ];

  const achievementSuggestions = [
    { id: '1', text: 'Increased team productivity by 40% through process optimization', reason: 'Quantifies leadership impact' },
    { id: '2', text: 'Led cross-functional team of 8 members across 3 departments', reason: 'Shows collaboration skills' },
    { id: '3', text: 'Reduced operational costs by AED 250,000 annually', reason: 'Demonstrates business impact' }
  ];

  const keywordSuggestions = [
    { id: '1', keyword: 'Agile methodology', frequency: 'High', relevance: 'Very relevant for tech roles' },
    { id: '2', keyword: 'Stakeholder management', frequency: 'Medium', relevance: 'Important for senior positions' },
    { id: '3', keyword: 'Business intelligence', frequency: 'Growing', relevance: 'Emerging skill requirement' }
  ];

  const applySuggestion = (id: string) => {
    setAppliedSuggestions(prev => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Suggestions</h2>
        <p className="text-gray-600">
          AI-powered recommendations to enhance your resume for the UAE job market
        </p>
      </div>

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Recommended Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{suggestion.skill}</h3>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {suggestion.confidence}% match
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestion.id)}
                    disabled={appliedSuggestions.includes(suggestion.id)}
                    className="bg-ehrdc-teal hover:bg-ehrdc-teal/90"
                  >
                    {appliedSuggestions.includes(suggestion.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Achievement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievementSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{suggestion.text}</p>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestion.id)}
                    disabled={appliedSuggestions.includes(suggestion.id)}
                    className="bg-ehrdc-teal hover:bg-ehrdc-teal/90 ml-4"
                  >
                    {appliedSuggestions.includes(suggestion.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Keyword Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keywordSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{suggestion.keyword}</h3>
                    <p className="text-sm text-gray-600">{suggestion.relevance}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {suggestion.frequency} frequency
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestion.id)}
                    disabled={appliedSuggestions.includes(suggestion.id)}
                    className="bg-ehrdc-teal hover:bg-ehrdc-teal/90"
                  >
                    {appliedSuggestions.includes(suggestion.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartSuggestions;
