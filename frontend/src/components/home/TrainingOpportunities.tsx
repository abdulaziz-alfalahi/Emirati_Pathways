import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface TrainingOpportunity {
  id: string;
  title: string;
  description: string;
  provider: string;
  duration: string;
  level: string;
  status: 'available' | 'upcoming' | 'completed';
  url: string;
}

const trainingOpportunities: TrainingOpportunity[] = [
  {
    id: '1',
    title: 'AI Fundamentals',
    description: 'Learn the basics of artificial intelligence and machine learning.',
    provider: 'Coursera',
    duration: '4 weeks',
    level: 'Beginner',
    status: 'available',
    url: 'https://www.coursera.org/ai-fundamentals'
  },
  {
    id: '2',
    title: 'Data Science Bootcamp',
    description: 'Intensive training in data analysis and visualization.',
    provider: 'Udacity',
    duration: '3 months',
    level: 'Intermediate',
    status: 'upcoming',
    url: 'https://www.udacity.com/data-science-bootcamp'
  },
  {
    id: '3',
    title: 'Web Development Masterclass',
    description: 'Become a full-stack web developer with this comprehensive course.',
    provider: 'Udemy',
    duration: '6 months',
    level: 'Advanced',
    status: 'completed',
    url: 'https://www.udemy.com/web-development-masterclass'
  },
];

const TrainingOpportunities: React.FC = () => {
  return (
    <section className="container py-12">
      <h2 className="text-3xl font-bold mb-8">Featured Training Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingOpportunities.map((opportunity) => (
          <Card key={opportunity.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold">{opportunity.title}</CardTitle>
              <CardDescription className="text-gray-500">{opportunity.provider}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-gray-700 mb-4">{opportunity.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Level:</span>
                  <span className="text-sm text-gray-600 ms-1">{opportunity.level}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm text-gray-600 ms-1">{opportunity.duration}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={
                  opportunity.status === 'available' ? 'default' : 'secondary'
                }>
                  {opportunity.status}
                </Badge>
                <Button asChild>
                  <a href={opportunity.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    Learn More
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TrainingOpportunities;
