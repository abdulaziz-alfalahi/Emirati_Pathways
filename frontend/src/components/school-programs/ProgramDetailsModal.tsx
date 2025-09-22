
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Building, School, Award, CheckCircle } from 'lucide-react';
import { SchoolProgram } from '@/types/schoolPrograms';

interface ProgramDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: SchoolProgram;
}

const ProgramDetailsModal: React.FC<ProgramDetailsModalProps> = ({
  open,
  onOpenChange,
  program
}) => {
  if (!program) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{program.title}</DialogTitle>
              <DialogDescription className="mt-1">
                Offered by <span className="font-medium">{program.institution}</span>
              </DialogDescription>
            </div>
            <Badge className={
              program.enrollmentStatus === 'Open' ? 'bg-green-100 text-green-800' : 
              program.enrollmentStatus === 'Coming Soon' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            } variant="secondary">
              {program.enrollmentStatus}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted mb-4">
                <img 
                  src={program.image} 
                  alt={program.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Program Description</h3>
                    <p className="text-muted-foreground">{program.description}</p>
                    <p className="text-muted-foreground mt-2">
                      This comprehensive program is designed to help students develop skills in critical thinking, problem-solving, 
                      and creative expression through interactive sessions and hands-on activities. Participants 
                      will work on real-world projects under the guidance of experienced educators.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-ehrdc-teal" />
                          Schedule Details
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Duration:</span>
                            <span className="text-muted-foreground">{program.duration}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Schedule:</span>
                            <span className="text-muted-foreground">{program.schedule}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Start Date:</span>
                            <span className="text-muted-foreground">{new Date(program.startDate).toLocaleDateString()}</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-ehrdc-teal" />
                          Location Details
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Campus:</span>
                            <span className="text-muted-foreground">{program.location}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Address:</span>
                            <span className="text-muted-foreground">123 Education Street, Dubai, UAE</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium w-24">Classroom:</span>
                            <span className="text-muted-foreground">Building B, Room 204</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="outcomes" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Program Learning Outcomes</h3>
                    <p className="text-muted-foreground mb-4">
                      By the end of this program, participants will be able to:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <span>Demonstrate advanced knowledge in the subject area</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <span>Apply critical thinking skills to solve complex problems</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <span>Work effectively in collaborative team environments</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <span>Communicate ideas clearly and confidently</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <span>Develop practical skills applicable to real-world scenarios</span>
                      </li>
                    </ul>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-ehrdc-teal" />
                        Certificates & Recognition
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Students who successfully complete this program will receive:
                      </p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-ehrdc-teal" />
                          <span>Official completion certificate</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-ehrdc-teal" />
                          <span>Digital badge for online portfolios</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-ehrdc-teal" />
                          <span>Recognition in the annual achievements showcase</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="requirements" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Eligibility Requirements</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <div>
                          <span className="font-medium">Age: </span>
                          <span className="text-muted-foreground">{program.ageRange}</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <div>
                          <span className="font-medium">Grade Level: </span>
                          <span className="text-muted-foreground">{program.gradeLevel.join(', ')}</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-ehrdc-teal mt-0.5" />
                        <div>
                          <span className="font-medium">Prerequisites: </span>
                          <span className="text-muted-foreground">Basic knowledge in related subjects</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <School className="h-4 w-4 text-ehrdc-teal" />
                        Application Process
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        To apply for this program, please complete the following steps:
                      </p>
                      <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="bg-ehrdc-teal/10 w-6 h-6 rounded-full flex items-center justify-center text-ehrdc-teal text-xs font-medium flex-shrink-0">1</div>
                          <span className="text-muted-foreground">Complete the online application form</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-ehrdc-teal/10 w-6 h-6 rounded-full flex items-center justify-center text-ehrdc-teal text-xs font-medium flex-shrink-0">2</div>
                          <span className="text-muted-foreground">Submit academic records if requested</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-ehrdc-teal/10 w-6 h-6 rounded-full flex items-center justify-center text-ehrdc-teal text-xs font-medium flex-shrink-0">3</div>
                          <span className="text-muted-foreground">Attend a brief interview or orientation session</span>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium">Program Overview</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="text-xs text-muted-foreground">Age Range</p>
                      <p className="font-medium">{program.ageRange}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{program.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="text-xs text-muted-foreground">Institution</p>
                      <p className="font-medium">{program.institution}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{program.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">Available Spots</div>
                    <Badge variant="outline">{program.spotsAvailable} remaining</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div 
                      className="bg-ehrdc-teal h-2 rounded-full" 
                      style={{ width: `${Math.min(100, 100 - (program.spotsAvailable / 25) * 100)}%` }}
                    ></div>
                  </div>
                  
                  <Button className="w-full ehrdc-button-primary">
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Program Categories</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Grade Level</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {program.gradeLevel.map((level) => (
                        <Badge key={level} variant="secondary">{level}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Subject Areas</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {program.subjectArea.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Program Type</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {program.programType.map((type) => (
                        <Badge key={type} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  If you have any questions about this program, please contact the program coordinator:
                </p>
                <Button variant="outline" className="w-full">
                  Contact Program Coordinator
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramDetailsModal;
