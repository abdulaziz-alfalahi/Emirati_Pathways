
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Layers, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Mock insights - Would be generated from AI analysis in a real implementation
const insightsData = {
  'private_sector_recruiter': [
    {
      id: 1,
      title: "Technical Skills Gap",
      description: "There's a 37% gap between candidate skills and job requirements in cloud computing roles.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      category: "critical"
    },
    {
      id: 2,
      title: "Emerging Talent Pool",
      description: "Recent graduates show strong competencies in AI/ML, with 42% having relevant projects in their portfolios.",
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      category: "positive"
    },
    {
      id: 3,
      title: "Leadership Experience",
      description: "Only 18% of technical candidates demonstrate leadership experience in their portfolios.",
      icon: <Layers className="h-5 w-5 text-blue-500" />,
      category: "opportunity"
    }
  ],
  'educational_institution': [
    {
      id: 1,
      title: "Curriculum Alignment",
      description: "Current curriculum covers only 65% of the skills most demanded in the job market.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      category: "critical"
    },
    {
      id: 2,
      title: "Student Achievement",
      description: "Graduates are showing 28% higher certification rates compared to the previous year.",
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      category: "positive"
    },
    {
      id: 3,
      title: "Practical Experience",
      description: "Students with internships perform 45% better in technical assessments.",
      icon: <Layers className="h-5 w-5 text-blue-500" />,
      category: "opportunity"
    }
  ],
  'government_representative': [
    {
      id: 1,
      title: "Emiratization Progress",
      description: "Private sector Emiratization showing 12% improvement in specialized technical roles.",
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      category: "positive"
    },
    {
      id: 2,
      title: "Strategic Sectors",
      description: "Healthcare and technology sectors show 32% gap in qualified Emirati candidates.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      category: "critical"
    },
    {
      id: 3,
      title: "Training Opportunities",
      description: "Targeted upskilling programs could close 64% of identified skill gaps within 18 months.",
      icon: <Layers className="h-5 w-5 text-blue-500" />,
      category: "opportunity"
    }
  ],
  'default': [
    {
      id: 1,
      title: "Portfolio Completion",
      description: "Complete your profile to receive personalized insights and analytics.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      category: "opportunity"
    }
  ]
};

const categoryStyles = {
  critical: "border-s-4 border-amber-500 bg-amber-50",
  positive: "border-s-4 border-emerald-500 bg-emerald-50",
  opportunity: "border-s-4 border-blue-500 bg-blue-50",
};

const PortfolioInsights = () => {
  const { roles } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine which insights to show based on user role
  let roleKey = 'default';
  if (roles.includes('private_sector_recruiter')) {
    roleKey = 'private_sector_recruiter';
  } else if (roles.includes('educational_institution')) {
    roleKey = 'educational_institution';
  } else if (roles.includes('government_representative')) {
    roleKey = 'government_representative';
  }
  
  const insights = insightsData[roleKey as keyof typeof insightsData];
  
  const refreshInsights = () => {
    setIsLoading(true);
    // Simulate API call to refresh insights
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshInsights} 
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Insights
        </Button>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <Card 
            key={insight.id} 
            className={`p-4 hover:shadow-md transition-shadow ${categoryStyles[insight.category as keyof typeof categoryStyles]}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-1">{insight.icon}</div>
              <div>
                <h3 className="font-medium">{insight.title}</h3>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {roleKey === 'default' && (
        <div className="text-center pt-4">
          <Button variant="secondary" size="sm">Complete Your Profile</Button>
        </div>
      )}
    </div>
  );
};

export default PortfolioInsights;
