import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Bell, GraduationCap, BarChart4, BookOpen, Clock, Search, Plus, Filter, Download } from 'lucide-react';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trainee } from '@/types/training-center';
import TraineeProfileViewer from './trainees/TraineeProfileViewer';

const TraineesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTraineeDialog, setShowAddTraineeDialog] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  
  // Sample trainee data
  const trainees: Trainee[] = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      email: 'ahmed.h@example.com',
      enrollDate: '2025-02-15',
      programs: ['Web Development Bootcamp', 'Digital Marketing Basics'],
      progress: 65,
      status: 'active',
      profileImage: '/placeholder.svg'
    },
    {
      id: 2,
      name: 'Fatima Ali',
      email: 'fatima.a@example.com',
      enrollDate: '2025-03-01',
      programs: ['Cloud Computing Certification'],
      progress: 78,
      status: 'active',
      profileImage: '/placeholder.svg'
    },
    {
      id: 3,
      name: 'Omar Khan',
      email: 'omar.k@example.com',
      enrollDate: '2025-01-20',
      programs: ['Digital Marketing Intensive'],
      progress: 92,
      status: 'graduated',
      profileImage: '/placeholder.svg'
    },
    {
      id: 4,
      name: 'Layla Mahmoud',
      email: 'layla.m@example.com',
      enrollDate: '2025-03-10',
      programs: ['Web Development Bootcamp'],
      progress: 42,
      status: 'active',
      profileImage: '/placeholder.svg'
    }
  ];

  const filteredTrainees = trainees.filter(trainee => 
    trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainee.programs.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: Trainee['status']) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-700">Active</Badge>;
      case 'graduated':
        return <Badge className="bg-green-500/10 text-green-700">Graduated</Badge>;
      case 'withdrawn':
        return <Badge className="bg-red-500/10 text-red-700">Withdrawn</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleViewTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Trainee Management</CardTitle>
              <CardDescription>Oversee trainee enrollment and progress</CardDescription>
            </div>
            <Dialog open={showAddTraineeDialog} onOpenChange={setShowAddTraineeDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="me-2 h-4 w-4" /> Add New Trainee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Trainee</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new trainee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-end">
                      Full Name
                    </label>
                    <Input id="name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-end">
                      Email
                    </label>
                    <Input id="email" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="program" className="text-end">
                      Program
                    </label>
                    <select className="col-span-3 p-2 border rounded">
                      <option value="">Select a program</option>
                      <option value="web-dev">Web Development Bootcamp</option>
                      <option value="digital">Digital Marketing Intensive</option>
                      <option value="cloud">Cloud Computing Certification</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddTraineeDialog(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setShowAddTraineeDialog(false);
                    // Here would be the code to add the trainee
                  }}>Add Trainee</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Trainee Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Trainees</p>
                    <p className="text-2xl font-bold">245</p>
                  </div>
                  <Users className="h-8 w-8 text-emirati-teal opacity-80" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Registrations</p>
                    <p className="text-2xl font-bold">36</p>
                  </div>
                  <Bell className="h-8 w-8 text-emirati-teal opacity-80" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Graduates</p>
                    <p className="text-2xl font-bold">182</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-emirati-teal opacity-80" />
                </div>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainees..."
                className="ps-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainee</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainees.map(trainee => (
                <TableRow key={trainee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={trainee.profileImage} alt={trainee.name} />
                        <AvatarFallback>{trainee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{trainee.name}</div>
                        <div className="text-sm text-muted-foreground">{trainee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {trainee.programs.map((program, i) => (
                        <Badge key={i} variant="outline" className="me-1">{program}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{trainee.progress}%</span>
                      </div>
                      <Progress value={trainee.progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(trainee.status)}</TableCell>
                  <TableCell>{trainee.enrollDate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewTrainee(trainee)}
                      >
                        View
                      </Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTrainees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No trainees found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="space-y-2 mt-6">
            <h3 className="text-lg font-medium">Current Cohorts</h3>
            <div className="border rounded-lg divide-y">
              <div className="p-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">Web Development Bootcamp</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">28 trainees • 6 weeks remaining</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">Digital Marketing Intensive</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">42 trainees • 3 weeks remaining</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">Cloud Computing Certification</h4>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Starting Soon</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">35 trainees • Starts in 5 days</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Preparation</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trainee Support Tools</CardTitle>
          <CardDescription>Tools for supporting trainees</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions 
            actions={[
              { title: "Progress Tracking", description: "Monitor trainee progress", icon: BarChart4 },
              { title: "Communication", description: "Send updates & notices", icon: Bell },
              { title: "Resource Center", description: "Manage learning materials", icon: BookOpen },
              { title: "Attendance Tracking", description: "Record & monitor attendance", icon: Clock },
              { title: "Performance Reports", description: "Generate trainee reports", icon: Download },
              { title: "Certification Manager", description: "Issue & track certifications", icon: GraduationCap }
            ]}
          />
        </CardContent>
      </Card>

      {selectedTrainee && (
        <Dialog open={!!selectedTrainee} onOpenChange={(open) => !open && setSelectedTrainee(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <TraineeProfileViewer 
              trainee={selectedTrainee} 
              onClose={() => setSelectedTrainee(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TraineesTab;
