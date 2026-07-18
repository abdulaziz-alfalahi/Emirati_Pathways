
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, BookOpen, Calendar, User, Users, School, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface EducationalInstitutionDashboardProps {
  activeTab: string;
}

const EducationalInstitutionDashboard: React.FC<EducationalInstitutionDashboardProps> = ({ activeTab }) => (
  <Tabs defaultValue={activeTab} className="space-y-8">
    <TabsList className="mb-4">
      <TabsTrigger value="overview"><User className="h-4 w-4 me-2" /> Overview</TabsTrigger>
      <TabsTrigger value="students"><Users className="h-4 w-4 me-2" /> Students</TabsTrigger>
      <TabsTrigger value="programs"><BookOpen className="h-4 w-4 me-2" /> Programs</TabsTrigger>
    </TabsList>

    <TabsContent value="overview" className="space-y-8">
      <DashboardOverview
        metrics={[
          { title: "Students", value: "1,247", change: "+5%", description: "Total registered students" },
          { title: "Programs", value: "24", change: "", description: "Active educational programs" },
          { title: "Scholarships", value: "12", change: "", description: "Available scholarship opportunities" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Summer Knowledge Camps</CardTitle>
              <CardDescription>Manage your institution's summer programs</CardDescription>
            </div>
            <Link to="/knowledge-camps">
              <Button>
                <Calendar className="me-2 h-4 w-4" /> Manage Camps
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Tech Innovators Camp</CardTitle>
                    <CardDescription>July 10-28, 2023</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Registrations:</span>
                        <span className="text-sm font-medium">18/30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center">
                    <Calendar className="h-8 w-8 mb-2 text-muted-foreground" />
                    <h3 className="font-medium">Create New Camp</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add a new summer program</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Scholarships</CardTitle>
              <CardDescription>Manage your educational scholarships</CardDescription>
            </div>
            <Link to="/scholarships">
              <Button>
                <Award className="me-2 h-4 w-4" /> Manage Scholarships
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Excellence Scholarship</CardTitle>
                    <CardDescription>For academic achievers</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Applications:</span>
                        <span className="text-sm font-medium">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center">
                    <Award className="h-8 w-8 mb-2 text-muted-foreground" />
                    <h3 className="font-medium">Create Scholarship</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add a new opportunity</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    <TabsContent value="students" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>Upload and manage student records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <User className="me-2 h-4 w-4" /> Upload Student Records
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="me-2 h-4 w-4" /> Schedule Academic Events
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <BarChart4 className="me-2 h-4 w-4" /> View Performance Analytics
          </Button>
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="programs" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Institution Tools</CardTitle>
          <CardDescription>Manage your educational institution</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions
            actions={[
              { title: "Student Records", description: "Upload and manage", icon: Users },
              { title: "Programs", description: "Manage educational offerings", icon: BookOpen },
              { title: "Scholarships", description: "Create opportunities", icon: Award, link: "/scholarships" },
              { title: "Knowledge Camps", description: "Organize programs", icon: Calendar, link: "/knowledge-camps" }
            ]}
          />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

export default EducationalInstitutionDashboard;
