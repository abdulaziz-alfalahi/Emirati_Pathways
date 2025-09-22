
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Award, 
  User, 
  Calendar,
  Move,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';

interface PortfolioBuilderProps {
  portfolio: any;
  onUpdate: () => void;
}

const PortfolioBuilder: React.FC<PortfolioBuilderProps> = ({ portfolio, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('projects');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const portfolioSections = [
    { id: 'hero', name: 'Hero Section', icon: User, description: 'Personal introduction and branding' },
    { id: 'projects', name: 'Projects', icon: FileText, description: 'Showcase your work and case studies' },
    { id: 'media', name: 'Media Gallery', icon: Image, description: 'Photos, videos, and visual content' },
    { id: 'achievements', name: 'Achievements', icon: Award, description: 'Awards, certifications, and recognition' },
    { id: 'timeline', name: 'Timeline', icon: Calendar, description: 'Professional journey and milestones' },
    { id: 'testimonials', name: 'Testimonials', icon: User, description: 'Client and colleague recommendations' }
  ];

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      console.log(`Moving ${draggedItem} to ${targetId}`);
      // Implement reordering logic here
      onUpdate();
    }
    setDraggedItem(null);
  };

  const handleAddContent = (sectionId: string, contentType: string) => {
    console.log(`Adding ${contentType} to ${sectionId}`);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Builder Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Builder</h2>
          <p className="text-muted-foreground">Drag and drop to customize your portfolio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Section Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="h-5 w-5" />
                Portfolio Sections
              </CardTitle>
              <CardDescription>
                Drag sections to reorder them in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolioSections.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, section.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, section.id)}
                  className={`p-4 border rounded-lg cursor-move hover:border-primary/50 transition-colors ${
                    activeSection === section.id ? 'border-primary bg-primary/5' : ''
                  } ${draggedItem === section.id ? 'opacity-50' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <section.icon className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{section.name}</h4>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Active</Badge>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Section Content</CardTitle>
              <CardDescription>
                Edit content for the selected section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsContent value="projects" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Projects</h4>
                    <Button size="sm" onClick={() => handleAddContent('projects', 'project')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="Project title" />
                    <Textarea placeholder="Project description" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Add Video
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Media Gallery</h4>
                    <Button size="sm" onClick={() => handleAddContent('media', 'upload')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Media
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Drag and drop files here</p>
                    <p className="text-sm text-muted-foreground">Support for images, videos, and documents</p>
                  </div>
                </TabsContent>

                <TabsContent value="achievements" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Achievements</h4>
                    <Button size="sm" onClick={() => handleAddContent('achievements', 'achievement')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Achievement
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="Achievement title" />
                    <Input placeholder="Issuing organization" />
                    <Input type="date" placeholder="Date received" />
                    <Textarea placeholder="Description" />
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Professional Timeline</h4>
                    <Button size="sm" onClick={() => handleAddContent('timeline', 'milestone')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="Event title" />
                    <Input type="date" placeholder="Date" />
                    <Input placeholder="Organization/Company" />
                    <Textarea placeholder="Description" />
                  </div>
                </TabsContent>

                <TabsContent value="testimonials" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Testimonials</h4>
                    <Button size="sm" onClick={() => handleAddContent('testimonials', 'testimonial')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="Person's name" />
                    <Input placeholder="Title and company" />
                    <Textarea placeholder="Testimonial text" />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Import Resume
              </Button>
              <Button className="w-full" variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Import Certifications
              </Button>
              <Button className="w-full" variant="outline">
                <User className="h-4 w-4 mr-2" />
                Connect LinkedIn
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Completion</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">8</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">25</div>
                  <div className="text-xs text-muted-foreground">Media Files</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
