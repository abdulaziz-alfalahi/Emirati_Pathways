
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, FileText, Users, BarChart3, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AssessmentType } from '@/types/assessments';
import { AssessmentsList } from '@/components/assessments/AssessmentsList';
import DashboardOverview from '../DashboardOverview';
import DashboardActions from '../DashboardActions';

interface AssessmentCenterDashboardProps {
  activeTab?: string;
}

// Define assessment types for categorization
const assessmentTypes = [
  { value: 'psychometric', label: 'Psychometric Tests', count: 8 },
  { value: 'cognitive', label: 'Cognitive Ability Tests', count: 12 },
  { value: 'emotional', label: 'Emotional Intelligence Tests', count: 5 },
  { value: 'personality', label: 'Personality Assessments', count: 9 },
  { value: 'skills', label: 'Skills Assessments', count: 15 },
  { value: 'aptitude', label: 'Aptitude Tests', count: 7 },
  { value: 'situational', label: 'Situational Judgment Tests', count: 10 },
  { value: 'behaviors', label: 'Behavioral Assessments', count: 14 },
  { value: 'technical', label: 'Technical Assessments', count: 11 },
  { value: 'integrity', label: 'Integrity Tests', count: 4 },
  { value: 'cultural', label: 'Cultural Fit Assessments', count: 6 },
  { value: 'roleplay', label: 'Role-Play Exercises', count: 3 },
  { value: 'casestudy', label: 'Case Studies', count: 8 },
  { value: 'intray', label: 'In-Tray Exercises', count: 5 },
  { value: 'gamified', label: 'Gamified Assessments', count: 7 },
  { value: 'language', label: 'Language Proficiency Tests', count: 9 },
  { value: 'creativity', label: 'Creativity Tests', count: 4 },
  { value: 'leadership', label: 'Leadership Assessments', count: 6 },
  { value: 'attention', label: 'Attention to Detail Tests', count: 5 },
  { value: 'typing', label: 'Typing Tests', count: 3 },
  { value: 'presentation', label: 'Presentation Exercises', count: 2 },
  { value: 'simulation', label: 'Simulation-Based Assessments', count: 7 },
];

// Sample assessment data for demonstration
const sampleAssessments = [
  { 
    id: "1", 
    title: "Critical Thinking Assessment", 
    type: "cognitive", 
    candidates: 42,
    avgScore: 78,
    lastUpdated: "2025-03-15" 
  },
  { 
    id: "2", 
    title: "Leadership Potential Evaluation", 
    type: "leadership", 
    candidates: 36, 
    avgScore: 82,
    lastUpdated: "2025-03-22" 
  },
  { 
    id: "3", 
    title: "Technical Skills Assessment", 
    type: "technical", 
    candidates: 51, 
    avgScore: 74,
    lastUpdated: "2025-03-28" 
  },
  { 
    id: "4", 
    title: "Emotional Intelligence Test", 
    type: "emotional", 
    candidates: 29, 
    avgScore: 85,
    lastUpdated: "2025-04-02" 
  },
  { 
    id: "5", 
    title: "Cultural Fit Evaluation", 
    type: "cultural", 
    candidates: 33, 
    avgScore: 79,
    lastUpdated: "2025-04-05" 
  },
];

const AssessmentCenterDashboard: React.FC<AssessmentCenterDashboardProps> = ({ activeTab = 'overview' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Filter assessments based on search term and selected type
  const filteredAssessments = sampleAssessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType ? assessment.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  // Metrics for the overview dashboard
  const metrics = [
    {
      title: "Total Assessments",
      value: "128",
      description: "Active assessment programs",
      change: "+12% from last month"
    },
    {
      title: "Candidates Assessed",
      value: "1,842",
      description: "Total participants",
      change: "+18% from last month"
    },
    {
      title: "Avg. Completion Rate",
      value: "84%",
      description: "Assessment completion",
      change: "+5% from last month"
    }
  ];

  // Quick actions for the dashboard
  const quickActions = [
    {
      title: "Create Assessment",
      description: "Add a new assessment program",
      icon: Plus,
      link: "/assessments"
    },
    {
      title: "Review Results",
      description: "View candidate results",
      icon: FileText,
      link: "/assessments"
    },
    {
      title: "Manage Candidates",
      description: "Review applicants",
      icon: Users,
      link: "/assessments"
    },
    {
      title: "View Analytics",
      description: "Assessment performance",
      icon: BarChart3,
      link: "/analytics"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assessment Center Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your assessments, candidates, and certification programs
          </p>
        </div>
      </div>

      <Tabs defaultValue={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard metrics */}
          <DashboardOverview metrics={metrics} />
          
          {/* Quick actions */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <DashboardActions actions={quickActions} />
          </div>
          
          {/* Recent assessments */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Assessments</h3>
              <Button variant="outline" size="sm" asChild>
                <a href="/assessments">View All</a>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {sampleAssessments.slice(0, 3).map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader className="pb-2">
                    <Badge className="w-fit mb-2">
                      {assessmentTypes.find(t => t.value === assessment.type)?.label || assessment.type}
                    </Badge>
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <CardDescription>Last updated: {assessment.lastUpdated}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div>Candidates: {assessment.candidates}</div>
                      <div>Avg. Score: {assessment.avgScore}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4 items-center">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assessments..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="p-2 border rounded-md bg-background"
                onChange={(e) => setSelectedType(e.target.value || null)}
                value={selectedType || ''}
              >
                <option value="">All Types</option>
                {assessmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assessment</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <p className="text-center text-muted-foreground">
                    Assessment creation form would go here
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Candidates</TableHead>
                  <TableHead className="text-center">Avg. Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assessmentTypes.find(t => t.value === assessment.type)?.label || assessment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{assessment.candidates}</TableCell>
                      <TableCell className="text-center">{assessment.avgScore}%</TableCell>
                      <TableCell>{assessment.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No assessments found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Candidates Management</CardTitle>
              <CardDescription>
                Review and manage candidate assessments and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Candidate management interface would go here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
              <CardDescription>
                View detailed assessment results and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Assessment results and analytics interface would go here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Reports</CardTitle>
              <CardDescription>
                Generate and view detailed assessment reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Reports generation and management interface would go here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessmentCenterDashboard;
