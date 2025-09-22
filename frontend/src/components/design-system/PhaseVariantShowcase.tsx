import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  Briefcase, 
  Users, 
  Building2,
  Palette,
  Type,
  Layout,
  Eye
} from 'lucide-react';
import { designTokens } from '@/design-system/tokens';

interface PhaseConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  characteristics: string[];
  targetAudience: string[];
}

const phases: PhaseConfig[] = [
  {
    id: 'education',
    name: 'Education Pathway',
    icon: GraduationCap,
    description: 'Foundational, structured, supportive design language for educational services',
    primaryColor: designTokens.colors.phases.education.primary,
    secondaryColor: designTokens.colors.phases.education.secondary,
    accentColor: designTokens.colors.phases.education.accent,
    backgroundColor: designTokens.colors.phases.education.background,
    characteristics: ['Trustworthy', 'Clear', 'Structured', 'Supportive', 'Accessible'],
    targetAudience: ['Students', 'Parents', 'Educators', 'Administrators']
  },
  {
    id: 'career',
    name: 'Career Entry',
    icon: Briefcase,
    description: 'Professional, aspirational design language for career development',
    primaryColor: designTokens.colors.phases.career.primary,
    secondaryColor: designTokens.colors.phases.career.secondary,
    accentColor: designTokens.colors.phases.career.accent,
    backgroundColor: designTokens.colors.phases.career.background,
    characteristics: ['Professional', 'Aspirational', 'Opportunity-focused', 'Modern', 'Dynamic'],
    targetAudience: ['Job seekers', 'Graduates', 'Career changers', 'Young professionals']
  },
  {
    id: 'professional',
    name: 'Professional Growth',
    icon: Users,
    description: 'Dynamic, innovative design language for skill development and networking',
    primaryColor: designTokens.colors.phases.professional.primary,
    secondaryColor: designTokens.colors.phases.professional.secondary,
    accentColor: designTokens.colors.phases.professional.accent,
    backgroundColor: designTokens.colors.phases.professional.background,
    characteristics: ['Innovative', 'Dynamic', 'Skill-focused', 'Collaborative', 'Growth-oriented'],
    targetAudience: ['Working professionals', 'Entrepreneurs', 'Skill developers', 'Networkers']
  },
  {
    id: 'lifelong',
    name: 'Lifelong Engagement',
    icon: Building2,
    description: 'Community-oriented, impactful design language for experienced professionals',
    primaryColor: designTokens.colors.phases.lifelong.primary,
    secondaryColor: designTokens.colors.phases.lifelong.secondary,
    accentColor: designTokens.colors.phases.lifelong.accent,
    backgroundColor: designTokens.colors.phases.lifelong.background,
    characteristics: ['Community-oriented', 'Impactful', 'Legacy-focused', 'Mentoring', 'Wisdom'],
    targetAudience: ['Experienced professionals', 'Community leaders', 'Mentors', 'Retirees']
  }
];

export const PhaseVariantShowcase: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<string>('education');
  
  const currentPhase = phases.find(p => p.id === selectedPhase) || phases[0];
  const PhaseIcon = currentPhase.icon;

  const renderPhaseColors = (phase: PhaseConfig) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Color Palette</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div 
            className="w-full h-20 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: phase.primaryColor }}
          >
            <span className="text-white text-sm font-medium">Primary</span>
          </div>
          <p className="text-xs text-center">{phase.primaryColor}</p>
        </div>
        <div className="space-y-2">
          <div 
            className="w-full h-20 rounded-lg border flex items-center justify-center"
            style={{ backgroundColor: phase.secondaryColor }}
          >
            <span className="text-gray-700 text-sm font-medium">Secondary</span>
          </div>
          <p className="text-xs text-center">{phase.secondaryColor}</p>
        </div>
        <div className="space-y-2">
          <div 
            className="w-full h-20 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: phase.accentColor }}
          >
            <span className="text-white text-sm font-medium">Accent</span>
          </div>
          <p className="text-xs text-center">{phase.accentColor}</p>
        </div>
        <div className="space-y-2">
          <div 
            className="w-full h-20 rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{ backgroundColor: phase.backgroundColor }}
          >
            <span className="text-gray-700 text-sm font-medium">Background</span>
          </div>
          <p className="text-xs text-center">Background Tint</p>
        </div>
      </div>
    </div>
  );

  const renderPhaseComponents = (phase: PhaseConfig) => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Component Variants</h3>
      
      {/* Buttons */}
      <div className="space-y-4">
        <h4 className="font-medium">Buttons</h4>
        <div className="flex flex-wrap gap-4">
          <Button 
            style={{ backgroundColor: phase.primaryColor }}
            className="text-white hover:opacity-90"
          >
            Primary Action
          </Button>
          <Button 
            variant="outline"
            style={{ borderColor: phase.primaryColor, color: phase.primaryColor }}
            className="hover:bg-opacity-10"
          >
            Secondary Action
          </Button>
          <Button 
            variant="ghost"
            style={{ color: phase.accentColor }}
            className="hover:bg-opacity-10"
          >
            Tertiary Action
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <h4 className="font-medium">Cards</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${phase.primaryColor}20` }}
                >
                  <PhaseIcon 
                    className="h-6 w-6"
                    style={{ color: phase.primaryColor }}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg">Service Card</CardTitle>
                  <CardDescription>Phase-specific service card design</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This card demonstrates the {phase.name.toLowerCase()} design language with 
                appropriate colors and styling.
              </p>
              <div className="flex gap-2">
                <Badge 
                  style={{ backgroundColor: phase.accentColor }}
                  className="text-white"
                >
                  Featured
                </Badge>
                <Badge variant="outline">Popular</Badge>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: phase.primaryColor }}
          >
            <CardHeader>
              <CardTitle className="text-lg">Information Card</CardTitle>
              <CardDescription>Phase-themed information display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: phase.primaryColor }}
                  >
                    Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium">{phase.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Priority</span>
                  <Badge 
                    variant="outline"
                    style={{ borderColor: phase.accentColor, color: phase.accentColor }}
                  >
                    High
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-4">
        <h4 className="font-medium">Form Elements</h4>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase-input">Phase-themed Input</Label>
            <Input 
              id="phase-input"
              placeholder="Enter information..."
              className="focus:border-2"
              style={{ 
                '--focus-color': phase.primaryColor 
              } as React.CSSProperties}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phase-select">Phase-themed Select</Label>
            <Select>
              <SelectTrigger id="phase-select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhaseGuidelines = (phase: PhaseConfig) => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Usage Guidelines</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Design Characteristics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phase.characteristics.map((characteristic) => (
                <Badge key={characteristic} variant="outline" className="mr-2 mb-2">
                  {characteristic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phase.targetAudience.map((audience) => (
                <div key={audience} className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{audience}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Primary Use Cases:</strong>
              <p className="text-gray-600 mt-1">
                Apply this design language to {phase.name.toLowerCase()} pages, components, 
                and interactions to create a cohesive experience that resonates with the target audience.
              </p>
            </div>
            <div>
              <strong>Color Application:</strong>
              <p className="text-gray-600 mt-1">
                Use the primary color for main actions and key elements, secondary color for 
                backgrounds and subtle elements, and accent color for highlights and status indicators.
              </p>
            </div>
            <div>
              <strong>Consistency Guidelines:</strong>
              <p className="text-gray-600 mt-1">
                Maintain the core EHRDC brand identity while applying phase-specific colors as accents. 
                Ensure smooth transitions between phases for users who navigate across multiple services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ehrdc-neutral-dark mb-4">
          Phase-Specific Design Variants
        </h1>
        <p className="text-lg text-ehrdc-neutral-dark/70 max-w-3xl mx-auto">
          Explore how the design system adapts to each phase of the citizen journey while 
          maintaining consistency and accessibility standards.
        </p>
      </div>

      {/* Phase Selector */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(phase.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  selectedPhase === phase.id
                    ? 'bg-white shadow-sm text-ehrdc-neutral-dark'
                    : 'text-ehrdc-neutral-dark/70 hover:text-ehrdc-neutral-dark'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{phase.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Overview */}
      <Card 
        className="border-l-4"
        style={{ borderLeftColor: currentPhase.primaryColor }}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${currentPhase.primaryColor}20` }}
            >
              <PhaseIcon 
                className="h-8 w-8"
                style={{ color: currentPhase.primaryColor }}
              />
            </div>
            <div>
              <CardTitle className="text-2xl">{currentPhase.name}</CardTitle>
              <CardDescription className="text-base">
                {currentPhase.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Phase Details */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {renderPhaseColors(currentPhase)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {renderPhaseComponents(currentPhase)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          {renderPhaseGuidelines(currentPhase)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
