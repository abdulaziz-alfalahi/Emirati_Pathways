
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Briefcase, Calendar, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';

const OverviewTab: React.FC = () => {
  return (
    <>
      <DashboardOverview 
        metrics={[
          { title: "Open Positions", value: "15", change: "", description: "Currently advertised jobs" },
          { title: "Applications", value: "47", change: "", description: "Received job applications" },
          { title: "Internship Programs", value: "8", change: "", description: "Available internship positions" },
          { title: "Scheduled Interviews", value: "12", change: "", description: "Upcoming candidate interviews" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common recruiter tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions 
            actions={[
              {
                title: "Schedule Interview", 
                description: "Set up candidate meetings", 
                icon: Calendar,
                link: "/career-advisory/interviews/schedule"
              },
              {
                title: "Video Interviews", 
                description: "Conduct remote sessions", 
                icon: Video,
                link: "/career-advisory/interviews"
              },
              {
                title: "Job Matching", 
                description: "Find suitable candidates", 
                icon: Users,
                link: "/matching"
              },
              {
                title: "Post Job", 
                description: "Create new listings", 
                icon: Briefcase,
                link: "/job-descriptions"
              }
            ]}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <JobDescriptionCard />
        <CandidateMatchingCard />
      </div>
    </>
  );
};

// Helper component for Job Description Management card
const JobDescriptionCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Job Description Management</CardTitle>
      <CardDescription>
        Create and manage job descriptions for matching
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        Our job description parser extracts structured information including:
      </p>
      <ul className="list-disc ps-5 text-sm text-muted-foreground mb-4">
        <li>Job title, company, and location</li>
        <li>Employment type and work mode</li>
        <li>Responsibilities and requirements</li>
        <li>Required skills, experience, and education</li>
        <li>Benefits and compensation details</li>
      </ul>
      <Button onClick={() => window.location.href = '/job-descriptions'} className="w-full mt-2">
        Manage Job Descriptions
      </Button>
    </CardContent>
  </Card>
);

// Helper component for Candidate Matching card
const CandidateMatchingCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Candidate Matching</CardTitle>
      <CardDescription>
        Find the right talent for your positions
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        Our matching system connects your job requirements with candidate profiles:
      </p>
      <ul className="list-disc ps-5 text-sm text-muted-foreground mb-4">
        <li>Skill-based matching algorithms</li>
        <li>Education and experience scoring</li>
        <li>Cultural fit assessment</li>
        <li>Location and availability filters</li>
      </ul>
      <Button onClick={() => window.location.href = '/matching?tab=jobs'} className="w-full mt-2">
        Match Jobs to Candidates
      </Button>
    </CardContent>
  </Card>
);

export default OverviewTab;
