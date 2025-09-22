
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  ThumbsUp, 
  Star,
  MousePointer
} from 'lucide-react';

interface AnalyticsOverviewCardsProps {
  userAssignment: any;
  userStats: any;
}

const AnalyticsOverviewCards: React.FC<AnalyticsOverviewCardsProps> = ({
  userAssignment,
  userStats
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Algorithm</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAssignment ? userAssignment.variantId : 'Control'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current recommendation variant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Given</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalFeedback || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total recommendations rated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpful Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.totalFeedback > 0 ? 
                Math.round((userStats.helpfulCount / userStats.totalFeedback) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recommendations marked helpful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.appliedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Opportunities applied to
            </p>
          </CardContent>
        </Card>
      </div>

      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle>Your Recommendation Experience</CardTitle>
            <CardDescription>Personal statistics and feedback summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Rating</span>
                  <span>{userStats.averageRating.toFixed(1)}/5.0</span>
                </div>
                <Progress value={(userStats.averageRating / 5) * 100} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Helpful: </span>
                  <Badge variant="secondary">{userStats.helpfulCount}</Badge>
                </div>
                <div>
                  <span className="font-medium">Applied: </span>
                  <Badge variant="secondary">{userStats.appliedCount}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AnalyticsOverviewCards;
