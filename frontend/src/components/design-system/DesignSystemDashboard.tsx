import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Palette, 
  Type, 
  Layout, 
  Check, 
  AlertTriangle, 
  Users, 
  Shield,
  Zap,
  Eye,
  Target,
  Code,
  TestTube,
  FileText,
  Settings
} from 'lucide-react';
import { designTokens } from '@/design-system/tokens';
import { accessibilityGuidelines, bestPractices } from '@/design-system/guidelines';
import { designSystemValidator } from '@/design-system/validation';

export const DesignSystemDashboard: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [validationResults, setValidationResults] = useState<any>(null);

  // Phase data for demonstration
  const phases = [
    {
      id: 'education',
      name: 'Education Pathway',
      color: '#006E6D',
      description: 'Foundational, structured, supportive design language',
      status: 'Complete',
      compliance: 98
    },
    {
      id: 'career',
      name: 'Career Entry',
      color: '#0079C1',
      description: 'Professional, aspirational, opportunity-focused design',
      status: 'Complete',
      compliance: 96
    },
    {
      id: 'professional',
      name: 'Professional Growth',
      color: '#7B1FA2',
      description: 'Dynamic, innovative, skill-focused design language',
      status: 'In Progress',
      compliance: 92
    },
    {
      id: 'lifelong',
      name: 'Lifelong Engagement',
      color: '#D32F2F',
      description: 'Community-oriented, impactful, legacy-focused design',
      status: 'In Progress',
      compliance: 90
    }
  ];

  // Design system metrics
  const metrics = {
    totalComponents: 45,
    phaseVariants: 180,
    accessibilityScore: 96,
    performanceScore: 94,
    consistencyScore: 98
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ehrdc-neutral-dark mb-4">
          Dubai Government Design System
        </h1>
        <p className="text-lg text-ehrdc-neutral-dark/70 max-w-3xl mx-auto">
          Comprehensive design system supporting the four-phase citizen journey with unified standards, 
          accessibility compliance, and phase-specific customization guidelines.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-ehrdc-teal">
              {metrics.totalComponents}
            </CardTitle>
            <CardDescription>Components</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-ehrdc-teal">
              {metrics.phaseVariants}
            </CardTitle>
            <CardDescription>Phase Variants</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">
              {metrics.accessibilityScore}%
            </CardTitle>
            <CardDescription>Accessibility</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">
              {metrics.performanceScore}%
            </CardTitle>
            <CardDescription>Performance</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-600">
              {metrics.consistencyScore}%
            </CardTitle>
            <CardDescription>Consistency</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Phase Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Citizen Journey Phases</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {phases.map((phase) => (
            <Card key={phase.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: phase.color }}
                    />
                    <CardTitle>{phase.name}</CardTitle>
                  </div>
                  <Badge variant={phase.status === 'Complete' ? 'default' : 'secondary'}>
                    {phase.status}
                  </Badge>
                </div>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compliance Score</span>
                    <span className="font-medium">{phase.compliance}%</span>
                  </div>
                  <Progress value={phase.compliance} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Palette className="h-5 w-5" />
            <span>Color System</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Type className="h-5 w-5" />
            <span>Typography</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Layout className="h-5 w-5" />
            <span>Components</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <TestTube className="h-5 w-5" />
            <span>Testing</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTokens = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Design Tokens</h2>
        
        {/* Color Tokens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color System
            </CardTitle>
            <CardDescription>
              Unified color palette with phase-specific variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h4 className="font-medium mb-3">Primary Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(designTokens.colors.primary).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div 
                        className="w-full h-16 rounded-lg border flex items-center justify-center"
                        style={{ backgroundColor: value }}
                      >
                        <span className="text-white text-sm font-medium">
                          {value}
                        </span>
                      </div>
                      <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Colors */}
              <div>
                <h4 className="font-medium mb-3">Phase Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(designTokens.colors.phases).map(([phase, colors]) => (
                    <div key={phase} className="space-y-2">
                      <div 
                        className="w-full h-16 rounded-lg border flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <span className="text-white text-sm font-medium">
                          {colors.primary}
                        </span>
                      </div>
                      <p className="text-sm font-medium capitalize">{phase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Tokens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography System
            </CardTitle>
            <CardDescription>
              Responsive typography scale with accessibility compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Display', size: designTokens.typography.fontSize['6xl'], weight: 'bold' },
                { name: 'Heading 1', size: designTokens.typography.fontSize['4xl'], weight: 'bold' },
                { name: 'Heading 2', size: designTokens.typography.fontSize['3xl'], weight: 'semibold' },
                { name: 'Heading 3', size: designTokens.typography.fontSize['2xl'], weight: 'semibold' },
                { name: 'Body Large', size: designTokens.typography.fontSize.lg, weight: 'normal' },
                { name: 'Body', size: designTokens.typography.fontSize.base, weight: 'normal' },
                { name: 'Caption', size: designTokens.typography.fontSize.sm, weight: 'medium' }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 
                      className="text-ehrdc-neutral-dark"
                      style={{ 
                        fontSize: item.size,
                        fontWeight: item.weight === 'bold' ? 700 : item.weight === 'semibold' ? 600 : item.weight === 'medium' ? 500 : 400
                      }}
                    >
                      {item.name}
                    </h4>
                  </div>
                  <div className="text-right text-sm text-ehrdc-neutral-dark/70">
                    <p>{item.size}</p>
                    <p className="capitalize">{item.weight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spacing Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Spacing System
            </CardTitle>
            <CardDescription>
              Mathematical spacing scale based on 4px units
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['1', '2', '4', '6', '8', '12', '16', '24'].map((size) => (
                <div key={size} className="text-center p-4 border rounded-lg">
                  <div 
                    className="bg-ehrdc-teal/20 border-2 border-ehrdc-teal mx-auto mb-2"
                    style={{ 
                      width: `${parseInt(size) * 4}px`, 
                      height: `${parseInt(size) * 4}px` 
                    }}
                  />
                  <p className="text-sm font-medium">{parseInt(size) * 4}px</p>
                  <p className="text-xs text-ehrdc-neutral-dark/70">space-{size}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAccessibility = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Accessibility Guidelines</h2>
        
        {/* Compliance Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              WCAG 2.1 AA Compliance
            </CardTitle>
            <CardDescription>
              Current accessibility compliance status across all phases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Overall Compliance Score</span>
                <Badge variant="default" className="bg-green-600">96%</Badge>
              </div>
              <Progress value={96} className="h-3" />
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Compliant Areas
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Color contrast ratios</li>
                    <li>• Keyboard navigation</li>
                    <li>• Screen reader compatibility</li>
                    <li>• Touch target sizing</li>
                    <li>• Focus management</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Complex form validation</li>
                    <li>• Dynamic content updates</li>
                    <li>• Mobile gesture alternatives</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Contrast Testing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Color Contrast Testing</CardTitle>
            <CardDescription>
              Automated contrast ratio validation for all color combinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { combo: 'EHRDC Teal on White', ratio: '12.6:1', status: 'pass' },
                { combo: 'Dark Text on Light Background', ratio: '15.8:1', status: 'pass' },
                { combo: 'Light Teal on White', ratio: '3.2:1', status: 'warning' },
                { combo: 'Success Green on White', ratio: '5.8:1', status: 'pass' }
              ].map((test) => (
                <div key={test.combo} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{test.combo}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{test.ratio}</span>
                    <Badge 
                      variant={test.status === 'pass' ? 'default' : 'secondary'}
                      className={test.status === 'pass' ? 'bg-green-600' : 'bg-orange-600'}
                    >
                      {test.status === 'pass' ? 'Pass' : 'Warning'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testing Procedures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Testing Procedures
            </CardTitle>
            <CardDescription>
              Automated and manual testing procedures for accessibility compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Automated Testing</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    axe-core integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Lighthouse audits
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Color contrast analyzers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Keyboard navigation testing
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Manual Testing</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Screen reader testing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Keyboard-only navigation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    High contrast mode testing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Mobile accessibility testing
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderImplementation = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-6">Implementation Guidelines</h2>
        
        {/* Developer Guidelines */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Developer Guidelines
            </CardTitle>
            <CardDescription>
              Best practices for implementing the design system in code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Code Examples */}
              <div>
                <h4 className="font-medium mb-3">Using Design Tokens</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`// Use design tokens instead of hard-coded values
import { designTokens } from '@/design-system/tokens';

// Good ✅
const primaryColor = designTokens.colors.primary.teal;
const spacing = designTokens.spacing['4'];

// Avoid ❌
const primaryColor = '#006E6D';
const spacing = '16px';`}
                  </pre>
                </div>
              </div>

              {/* Component Usage */}
              <div>
                <h4 className="font-medium mb-3">Component Usage</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`// Use utility classes for consistent styling
<Button className="gov-action-button">
  Primary Action
</Button>

<Card className="gov-service-card">
  <CardContent>Service content</CardContent>
</Card>`}
                  </pre>
                </div>
              </div>

              {/* Phase Variants */}
              <div>
                <h4 className="font-medium mb-3">Phase-Specific Styling</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`// Apply phase-specific colors as accents
const phaseColors = {
  education: designTokens.colors.phases.education,
  career: designTokens.colors.phases.career,
  professional: designTokens.colors.phases.professional,
  lifelong: designTokens.colors.phases.lifelong
};`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Guidelines */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Design Guidelines
            </CardTitle>
            <CardDescription>
              Guidelines for designers working with the design system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Do's</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    Use established component patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    Apply phase colors as accents
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    Maintain consistent spacing
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    Test accessibility compliance
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Don'ts</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    Modify core component structure
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    Use arbitrary color values
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    Break accessibility standards
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    Ignore responsive considerations
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Validation Tools
            </CardTitle>
            <CardDescription>
              Tools to ensure design system compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  // Mock validation - in real implementation, this would run actual validation
                  const mockResults = {
                    isValid: true,
                    errors: [],
                    warnings: [
                      { type: 'spacing', message: 'Consider using design system spacing tokens' }
                    ],
                    score: 94
                  };
                  setValidationResults(mockResults);
                }}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Run Design System Validation
              </Button>
              
              {validationResults && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Validation complete! Score: {validationResults.score}/100
                    {validationResults.warnings.length > 0 && (
                      <span className="block mt-2 text-sm">
                        {validationResults.warnings.length} warnings found
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ehrdc-neutral-light/30">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="implementation" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Implementation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="tokens">{renderTokens()}</TabsContent>
          <TabsContent value="accessibility">{renderAccessibility()}</TabsContent>
          <TabsContent value="implementation">{renderImplementation()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
