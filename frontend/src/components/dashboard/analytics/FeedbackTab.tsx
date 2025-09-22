
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp, Star } from 'lucide-react';

const FeedbackTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Analysis</CardTitle>
        <CardDescription>
          How user feedback is improving our recommendation algorithms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Continuous Improvement</h3>
            <p className="text-muted-foreground">
              Your feedback directly influences our recommendation algorithms. 
              We use machine learning to adapt and improve based on user preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center">
                <Eye className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-lg">Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                We monitor how you interact with recommendations to understand preferences
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-lg">Learning</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                Feedback helps our AI learn what makes recommendations more relevant
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Star className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Optimizing</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                Algorithms are continuously refined to provide better matches
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">How We Use Your Feedback:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Adjust recommendation scoring weights based on what you find helpful</li>
              <li>• Identify patterns in successful matches to improve future suggestions</li>
              <li>• A/B test different algorithms to optimize effectiveness</li>
              <li>• Learn your preferences to personalize future recommendations</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackTab;
