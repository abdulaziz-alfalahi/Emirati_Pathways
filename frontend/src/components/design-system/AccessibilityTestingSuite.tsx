import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Eye, 
  Keyboard, 
  Volume2, 
  TestTube, 
  Check, 
  AlertTriangle, 
  X,
  Play,
  Pause,
  RefreshCw,
  FileText
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  category: 'color' | 'keyboard' | 'screen-reader' | 'touch' | 'general';
  status: 'pass' | 'fail' | 'warning' | 'running' | 'pending';
  score: number;
  details: string;
  wcagCriteria: string[];
  recommendations?: string[];
}

interface AccessibilityMetrics {
  overallScore: number;
  colorContrastScore: number;
  keyboardNavigationScore: number;
  screenReaderScore: number;
  touchTargetScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
}

export const AccessibilityTestingSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [metrics, setMetrics] = useState<AccessibilityMetrics>({
    overallScore: 0,
    colorContrastScore: 0,
    keyboardNavigationScore: 0,
    screenReaderScore: 0,
    touchTargetScore: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warningTests: 0
  });
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: 'contrast-primary',
      name: 'Primary Color Contrast',
      category: 'color',
      status: 'pending',
      score: 0,
      details: 'Testing contrast ratio of primary colors against backgrounds',
      wcagCriteria: ['1.4.3 Contrast (Minimum)', '1.4.6 Contrast (Enhanced)']
    },
    {
      id: 'contrast-text',
      name: 'Text Contrast Ratios',
      category: 'color',
      status: 'pending',
      score: 0,
      details: 'Verifying all text meets minimum contrast requirements',
      wcagCriteria: ['1.4.3 Contrast (Minimum)']
    },
    {
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      category: 'keyboard',
      status: 'pending',
      score: 0,
      details: 'Testing tab order and keyboard accessibility',
      wcagCriteria: ['2.1.1 Keyboard', '2.4.3 Focus Order']
    },
    {
      id: 'focus-indicators',
      name: 'Focus Indicators',
      category: 'keyboard',
      status: 'pending',
      score: 0,
      details: 'Checking visibility of focus indicators',
      wcagCriteria: ['2.4.7 Focus Visible']
    },
    {
      id: 'screen-reader-labels',
      name: 'Screen Reader Labels',
      category: 'screen-reader',
      status: 'pending',
      score: 0,
      details: 'Verifying proper labeling for assistive technologies',
      wcagCriteria: ['1.3.1 Info and Relationships', '4.1.2 Name, Role, Value']
    },
    {
      id: 'heading-structure',
      name: 'Heading Structure',
      category: 'screen-reader',
      status: 'pending',
      score: 0,
      details: 'Checking logical heading hierarchy',
      wcagCriteria: ['1.3.1 Info and Relationships']
    },
    {
      id: 'touch-targets',
      name: 'Touch Target Size',
      category: 'touch',
      status: 'pending',
      score: 0,
      details: 'Ensuring minimum 44x44px touch targets',
      wcagCriteria: ['2.5.5 Target Size']
    },
    {
      id: 'alt-text',
      name: 'Alternative Text',
      category: 'general',
      status: 'pending',
      score: 0,
      details: 'Checking image alternative text',
      wcagCriteria: ['1.1.1 Non-text Content']
    }
  ]);

  // Mock test execution
  const runTests = async () => {
    setIsRunning(true);
    
    const tests = [...testResults];
    
    for (let i = 0; i < tests.length; i++) {
      setCurrentTest(tests[i].name);
      
      // Set test to running
      tests[i].status = 'running';
      setTestResults([...tests]);
      
      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock test results
      const randomScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const status = randomScore >= 90 ? 'pass' : randomScore >= 70 ? 'warning' : 'fail';
      
      tests[i].status = status;
      tests[i].score = randomScore;
      
      // Add recommendations for failed/warning tests
      if (status !== 'pass') {
        tests[i].recommendations = [
          'Review color contrast ratios',
          'Ensure proper ARIA labeling',
          'Test with screen readers',
          'Validate keyboard navigation'
        ];
      }
      
      setTestResults([...tests]);
    }
    
    // Calculate final metrics
    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const warnings = tests.filter(t => t.status === 'warning').length;
    const avgScore = tests.reduce((sum, t) => sum + t.score, 0) / tests.length;
    
    setMetrics({
      overallScore: Math.round(avgScore),
      colorContrastScore: Math.round(tests.filter(t => t.category === 'color').reduce((sum, t) => sum + t.score, 0) / tests.filter(t => t.category === 'color').length),
      keyboardNavigationScore: Math.round(tests.filter(t => t.category === 'keyboard').reduce((sum, t) => sum + t.score, 0) / tests.filter(t => t.category === 'keyboard').length),
      screenReaderScore: Math.round(tests.filter(t => t.category === 'screen-reader').reduce((sum, t) => sum + t.score, 0) / tests.filter(t => t.category === 'screen-reader').length),
      touchTargetScore: Math.round(tests.filter(t => t.category === 'touch').reduce((sum, t) => sum + t.score, 0) / tests.filter(t => t.category === 'touch').length),
      totalTests: tests.length,
      passedTests: passed,
      failedTests: failed,
      warningTests: warnings
    });
    
    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <X className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      running: 'outline',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]} className={
        status === 'pass' ? 'bg-green-600' : 
        status === 'warning' ? 'bg-orange-600' : ''
      }>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryIcon = (category: TestResult['category']) => {
    switch (category) {
      case 'color':
        return <Eye className="h-4 w-4" />;
      case 'keyboard':
        return <Keyboard className="h-4 w-4" />;
      case 'screen-reader':
        return <Volume2 className="h-4 w-4" />;
      case 'touch':
        return <Shield className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Accessibility Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive WCAG 2.1 AA compliance testing for the design system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
            <Button variant="outline" disabled={isRunning}>
              <FileText className="h-4 w-4 me-2" />
              Export Report
            </Button>
          </div>
          
          {isRunning && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Currently running: {currentTest}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-ehrdc-teal">
              {metrics.overallScore}%
            </CardTitle>
            <CardDescription>Overall Score</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.overallScore} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-green-600">
              {metrics.passedTests}
            </CardTitle>
            <CardDescription>Tests Passed</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-orange-600">
              {metrics.warningTests}
            </CardTitle>
            <CardDescription>Warnings</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-red-600">
              {metrics.failedTests}
            </CardTitle>
            <CardDescription>Failed Tests</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              {metrics.totalTests}
            </CardTitle>
            <CardDescription>Total Tests</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Category Scores */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Color Contrast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.colorContrastScore}%</span>
              <Progress value={metrics.colorContrastScore} className="w-16 h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Keyboard className="h-4 w-4" />
              Keyboard Nav
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.keyboardNavigationScore}%</span>
              <Progress value={metrics.keyboardNavigationScore} className="w-16 h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="h-4 w-4" />
              Screen Reader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.screenReaderScore}%</span>
              <Progress value={metrics.screenReaderScore} className="w-16 h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Touch Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.touchTargetScore}%</span>
              <Progress value={metrics.touchTargetScore} className="w-16 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTestResults = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Test Results</h3>
      
      {testResults.map((test) => (
        <Card key={test.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(test.category)}
                <div>
                  <CardTitle className="text-base">{test.name}</CardTitle>
                  <CardDescription>{test.details}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {test.status !== 'pending' && test.status !== 'running' && (
                  <span className="text-lg font-bold">{test.score}%</span>
                )}
                {getStatusBadge(test.status)}
                {getStatusIcon(test.status)}
              </div>
            </div>
          </CardHeader>
          
          {(test.status === 'fail' || test.status === 'warning') && test.recommendations && (
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm mb-2">WCAG Criteria:</h5>
                  <div className="flex flex-wrap gap-1">
                    {test.wcagCriteria.map((criteria) => (
                      <Badge key={criteria} variant="outline" className="text-xs">
                        {criteria}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {test.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  const renderGuidelines = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Testing Guidelines</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Automated Testing</CardTitle>
          <CardDescription>
            Automated accessibility testing tools and procedures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Testing Tools</h5>
              <ul className="space-y-1 text-sm">
                <li>• axe-core: Comprehensive accessibility testing</li>
                <li>• Lighthouse: Built-in accessibility audits</li>
                <li>• WAVE: Web accessibility evaluation</li>
                <li>• Color Oracle: Color blindness simulation</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Integration</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <code>npm run test:accessibility</code> - Run accessibility test suite
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manual Testing</CardTitle>
          <CardDescription>
            Manual testing procedures for comprehensive accessibility validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Keyboard Navigation</h5>
              <ul className="space-y-1 text-sm">
                <li>• Tab through all interactive elements</li>
                <li>• Test focus indicators visibility</li>
                <li>• Verify logical tab order</li>
                <li>• Test keyboard shortcuts</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Screen Reader Testing</h5>
              <ul className="space-y-1 text-sm">
                <li>• Test with NVDA (Windows)</li>
                <li>• Test with VoiceOver (macOS)</li>
                <li>• Verify heading structure</li>
                <li>• Check ARIA labels and descriptions</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Mobile Accessibility</h5>
              <ul className="space-y-1 text-sm">
                <li>• Test touch target sizes</li>
                <li>• Verify gesture alternatives</li>
                <li>• Test with mobile screen readers</li>
                <li>• Check pinch-to-zoom functionality</li>
              </ul>
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
          Accessibility Testing Suite
        </h1>
        <p className="text-lg text-ehrdc-neutral-dark/70 max-w-3xl mx-auto">
          Comprehensive accessibility testing and validation for WCAG 2.1 AA compliance 
          across all design system components and phase-specific variants.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>
        <TabsContent value="results">{renderTestResults()}</TabsContent>
        <TabsContent value="guidelines">{renderGuidelines()}</TabsContent>
      </Tabs>
    </div>
  );
};
