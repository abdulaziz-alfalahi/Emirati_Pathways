import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, BookOpen, Briefcase, Calendar, User, Users, ArrowRight, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParentAssessmentOverview } from '@/components/assessments/ParentAssessmentOverview';

interface ParentDashboardProps {
  activeTab: string;
}

const knowledgeCamps = [
  {
    id: '1',
    title: 'STEM Innovation Camp',
    category: 'Technology',
    dates: 'Jun 15 – Jul 10, 2025',
    location: 'Dubai Knowledge Park',
    ages: '14–17',
    spotsLeft: 12,
    children: [
      { name: 'Ahmed', status: 'enrolled' as const },
      { name: 'Fatima', status: 'eligible' as const },
    ],
  },
  {
    id: '2',
    title: 'Arabic Heritage & Poetry Workshop',
    category: 'Language',
    dates: 'Jul 5 – Jul 25, 2025',
    location: 'Sharjah Cultural Centre',
    ages: '12–16',
    spotsLeft: 24,
    children: [
      { name: 'Ahmed', status: 'eligible' as const },
      { name: 'Fatima', status: 'enrolled' as const },
    ],
  },
  {
    id: '3',
    title: 'Future Leaders Programme',
    category: 'Leadership',
    dates: 'Aug 1 – Aug 20, 2025',
    location: 'Abu Dhabi Youth Hub',
    ages: '15–18',
    spotsLeft: 8,
    children: [
      { name: 'Ahmed', status: 'eligible' as const },
      { name: 'Fatima', status: 'not-eligible' as const },
    ],
  },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({ activeTab }) => {
  // Mock data for children - in a real app this would come from the database
  const children = [
    { id: "child-1", name: "Ahmed", age: 16, grade: "11" },
    { id: "child-2", name: "Fatima", age: 14, grade: "9" }
  ];

  const statusBadge = (status: 'enrolled' | 'eligible' | 'not-eligible') => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      'enrolled': { bg: '#DCFCE7', color: '#166534', label: '✓ Enrolled' },
      'eligible': { bg: '#DBEAFE', color: '#1E40AF', label: 'Eligible' },
      'not-eligible': { bg: '#F3F4F6', color: '#6B7280', label: 'Age mismatch' },
    };
    const s = styles[status];
    return (
      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <Tabs defaultValue={activeTab} className="space-y-8">
      <TabsList className="mb-4">
        <TabsTrigger value="overview"><User className="h-4 w-4 me-2" /> Overview</TabsTrigger>
        <TabsTrigger value="children"><Users className="h-4 w-4 me-2" /> Children</TabsTrigger>
        <TabsTrigger value="camps"><Calendar className="h-4 w-4 me-2" /> Knowledge Camps</TabsTrigger>
        <TabsTrigger value="assessments"><BookOpen className="h-4 w-4 me-2" /> Assessments</TabsTrigger>
        <TabsTrigger value="resources"><BookOpen className="h-4 w-4 me-2" /> Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        <DashboardOverview
          metrics={[
            { title: "Children", value: "2", change: "", description: "Registered children" },
            { title: "Upcoming Events", value: "4", change: "", description: "School and activity events" },
            { title: "Recommended Programs", value: "7", change: "", description: "Based on your children's interests" }
          ]}
        />
      </TabsContent>

      <TabsContent value="children" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Children's Progress</CardTitle>
            <CardDescription>Academic and activity reports for your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <h3 className="font-medium">Ahmed (16)</h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Grade 11</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Overall GPA:</span>
                  <span className="ms-2 font-medium">3.8/4.0</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Attendance:</span>
                  <span className="ms-2 font-medium">98%</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                View Full Report
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <h3 className="font-medium">Fatima (14)</h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Grade 9</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Overall GPA:</span>
                  <span className="ms-2 font-medium">3.9/4.0</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Attendance:</span>
                  <span className="ms-2 font-medium">99%</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                View Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="camps" className="space-y-6">
        {/* Header with link */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Knowledge Camps</h2>
            <p className="text-sm text-muted-foreground">Browse and manage camp enrolments for your children</p>
          </div>
          <Link to="/knowledge-camps">
            <Button variant="outline" size="sm" className="gap-1">
              Browse All Camps <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Camp cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeCamps.map(camp => (
            <Card key={camp.id} className="hover:shadow-md transition-shadow">
              <div style={{ height: 4, background: '#0D9488', borderRadius: '8px 8px 0 0' }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{camp.title}</CardTitle>
                  <span style={{
                    padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                    background: camp.category === 'Technology' ? '#DBEAFE' : camp.category === 'Language' ? '#DCFCE7' : '#FEF3C7',
                    color: camp.category === 'Technology' ? '#1E40AF' : camp.category === 'Language' ? '#166534' : '#92400E',
                    whiteSpace: 'nowrap',
                  }}>
                    {camp.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Details */}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {camp.dates}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {camp.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Ages {camp.ages}
                  </div>
                </div>

                {/* Spots indicator */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className={camp.spotsLeft <= 10 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                    {camp.spotsLeft} spots remaining
                  </span>
                </div>

                {/* Children enrollment status */}
                <div style={{
                  background: '#F9FAFB', borderRadius: 10, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Your Children
                  </div>
                  <div className="space-y-1.5">
                    {camp.children.map((child, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{child.name}</span>
                        {statusBadge(child.status)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <Button size="sm" className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white">
                  Manage Enrolment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assessments" className="space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {children.map(child => (
            <ParentAssessmentOverview
              key={child.id}
              childId={child.id}
              childName={child.name}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="resources" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Parent Resources</CardTitle>
            <CardDescription>Tools to support your children's journey</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardActions
              actions={[
                { title: "Academic Reports", description: "View children's progress", icon: BookOpen },
                { title: "Knowledge Camps", description: "Browse and register", icon: Calendar, link: "/knowledge-camps" },
                { title: "Scholarship Opportunities", description: "Financial aid options", icon: BarChart4 },
                { title: "Career Guidance", description: "Help plan their future", icon: Briefcase }
              ]}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ParentDashboard;
