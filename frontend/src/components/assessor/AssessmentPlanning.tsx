import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon,
  Clock,
  Users,
  Target,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Save,
  Send,
  FileText,
  Settings,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';

interface CompetencyModel {
  id: number;
  name: string;
  description: string;
  competencyType: string;
  nqfLevel: number;
  assessmentMethods: string[];
  weightage: number;
}

interface AssessmentPlan {
  id?: number;
  title: string;
  description: string;
  candidateId?: number;
  competencies: CompetencyModel[];
  assessmentMethods: string[];
  duration: number;
  scheduledDate?: Date;
  instructions: string;
  resources: string[];
  scoringCriteria: ScoringCriterion[];
  qualityChecks: QualityCheck[];
  status: string;
}

interface ScoringCriterion {
  id: string;
  competencyId: number;
  criterion: string;
  weight: number;
  maxScore: number;
  rubric: RubricLevel[];
}

interface RubricLevel {
  level: string;
  score: number;
  description: string;
}

interface QualityCheck {
  id: string;
  checkType: string;
  description: string;
  required: boolean;
}

const AssessmentPlanning: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<AssessmentPlan>({
    title: '',
    description: '',
    competencies: [],
    assessmentMethods: [],
    duration: 60,
    instructions: '',
    resources: [],
    scoringCriteria: [],
    qualityChecks: [],
    status: 'draft'
  });

  const [availableCompetencies, setAvailableCompetencies] = useState<CompetencyModel[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Sample data
  const assessmentMethods = [
    'Multiple Choice Questions',
    'Practical Demonstration',
    'Case Study Analysis',
    'Portfolio Review',
    'Interview Assessment',
    'Simulation Exercise',
    'Peer Assessment',
    'Self Assessment'
  ];

  const qualityCheckTemplates = [
    { id: 'bias_check', type: 'Bias Detection', description: 'Check for potential assessment bias', required: true },
    { id: 'reliability', type: 'Reliability Check', description: 'Ensure assessment reliability', required: true },
    { id: 'validity', type: 'Content Validity', description: 'Validate assessment content alignment', required: true },
    { id: 'accessibility', type: 'Accessibility Review', description: 'Check accessibility compliance', required: false },
    { id: 'cultural', type: 'Cultural Sensitivity', description: 'Review for cultural appropriateness', required: true }
  ];

  useEffect(() => {
    fetchAvailableCompetencies();
  }, []);

  const fetchAvailableCompetencies = async () => {
    // Simulate API call
    setAvailableCompetencies([
      {
        id: 1,
        name: 'Technical Problem Solving',
        description: 'Ability to analyze and solve complex technical problems',
        competencyType: 'Technical',
        nqfLevel: 6,
        assessmentMethods: ['Case Study Analysis', 'Practical Demonstration'],
        weightage: 25
      },
      {
        id: 2,
        name: 'Leadership and Team Management',
        description: 'Capability to lead teams and manage projects effectively',
        competencyType: 'Behavioral',
        nqfLevel: 7,
        assessmentMethods: ['Interview Assessment', 'Simulation Exercise'],
        weightage: 20
      },
      {
        id: 3,
        name: 'Communication Skills',
        description: 'Effective verbal and written communication abilities',
        competencyType: 'Behavioral',
        nqfLevel: 5,
        assessmentMethods: ['Interview Assessment', 'Portfolio Review'],
        weightage: 15
      },
      {
        id: 4,
        name: 'Data Analysis and Interpretation',
        description: 'Skills in analyzing and interpreting complex data sets',
        competencyType: 'Technical',
        nqfLevel: 6,
        assessmentMethods: ['Case Study Analysis', 'Practical Demonstration'],
        weightage: 20
      },
      {
        id: 5,
        name: 'Strategic Thinking',
        description: 'Ability to think strategically and make informed decisions',
        competencyType: 'Cognitive',
        nqfLevel: 8,
        assessmentMethods: ['Case Study Analysis', 'Interview Assessment'],
        weightage: 20
      }
    ]);
  };

  const handleCompetencySelection = (competencyId: number, selected: boolean) => {
    if (selected) {
      setSelectedCompetencies([...selectedCompetencies, competencyId]);
      const competency = availableCompetencies.find(c => c.id === competencyId);
      if (competency) {
        setCurrentPlan(prev => ({
          ...prev,
          competencies: [...prev.competencies, competency]
        }));
        
        // Add default scoring criteria
        const defaultCriteria: ScoringCriterion = {
          id: `criteria_${competencyId}`,
          competencyId: competencyId,
          criterion: `${competency.name} Assessment`,
          weight: competency.weightage,
          maxScore: 100,
          rubric: [
            { level: 'Excellent', score: 90, description: 'Exceeds expectations significantly' },
            { level: 'Good', score: 75, description: 'Meets expectations well' },
            { level: 'Satisfactory', score: 60, description: 'Meets minimum expectations' },
            { level: 'Needs Improvement', score: 40, description: 'Below expectations' },
            { level: 'Unsatisfactory', score: 20, description: 'Well below expectations' }
          ]
        };
        
        setCurrentPlan(prev => ({
          ...prev,
          scoringCriteria: [...prev.scoringCriteria, defaultCriteria]
        }));
      }
    } else {
      setSelectedCompetencies(selectedCompetencies.filter(id => id !== competencyId));
      setCurrentPlan(prev => ({
        ...prev,
        competencies: prev.competencies.filter(c => c.id !== competencyId),
        scoringCriteria: prev.scoringCriteria.filter(sc => sc.competencyId !== competencyId)
      }));
    }
  };

  const handleMethodSelection = (method: string, selected: boolean) => {
    if (selected) {
      setCurrentPlan(prev => ({
        ...prev,
        assessmentMethods: [...prev.assessmentMethods, method]
      }));
    } else {
      setCurrentPlan(prev => ({
        ...prev,
        assessmentMethods: prev.assessmentMethods.filter(m => m !== method)
      }));
    }
  };

  const addResource = () => {
    setCurrentPlan(prev => ({
      ...prev,
      resources: [...prev.resources, '']
    }));
  };

  const updateResource = (index: number, value: string) => {
    setCurrentPlan(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => i === index ? value : resource)
    }));
  };

  const removeResource = (index: number) => {
    setCurrentPlan(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const updateScoringCriterion = (criterionId: string, updates: Partial<ScoringCriterion>) => {
    setCurrentPlan(prev => ({
      ...prev,
      scoringCriteria: prev.scoringCriteria.map(sc => 
        sc.id === criterionId ? { ...sc, ...updates } : sc
      )
    }));
  };

  const handleQualityCheckToggle = (checkId: string, enabled: boolean) => {
    const template = qualityCheckTemplates.find(t => t.id === checkId);
    if (!template) return;

    if (enabled) {
      const newCheck: QualityCheck = {
        id: checkId,
        checkType: template.type,
        description: template.description,
        required: template.required
      };
      setCurrentPlan(prev => ({
        ...prev,
        qualityChecks: [...prev.qualityChecks, newCheck]
      }));
    } else {
      setCurrentPlan(prev => ({
        ...prev,
        qualityChecks: prev.qualityChecks.filter(qc => qc.id !== checkId)
      }));
    }
  };

  const savePlan = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving assessment plan:', currentPlan);
      // Show success message
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      // Simulate AI-powered plan generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Auto-populate some fields based on selected competencies
      const suggestedMethods = Array.from(new Set(
        currentPlan.competencies.flatMap(c => c.assessmentMethods)
      ));
      
      setCurrentPlan(prev => ({
        ...prev,
        assessmentMethods: suggestedMethods,
        duration: Math.max(60, prev.competencies.length * 30),
        instructions: `This assessment evaluates ${prev.competencies.length} key competencies: ${prev.competencies.map(c => c.name).join(', ')}. Please ensure all assessment methods are completed within the allocated time.`
      }));
      
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePlan = () => {
    const errors = [];
    
    if (!currentPlan.title.trim()) errors.push('Assessment title is required');
    if (currentPlan.competencies.length === 0) errors.push('At least one competency must be selected');
    if (currentPlan.assessmentMethods.length === 0) errors.push('At least one assessment method must be selected');
    if (currentPlan.duration < 30) errors.push('Assessment duration must be at least 30 minutes');
    
    return errors;
  };

  const errors = validatePlan();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Planning</h1>
          <p className="text-gray-600 mt-1">Create comprehensive assessment plans with NQF alignment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePlan} disabled={loading}>
            <Lightbulb className="h-4 w-4 me-2" />
            AI Generate
          </Button>
          <Button onClick={savePlan} disabled={loading || errors.length > 0}>
            <Save className="h-4 w-4 me-2" />
            Save Plan
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following issues: {errors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Planning Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Assessment Information</CardTitle>
              <CardDescription>Define the fundamental details of your assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assessment Title *</Label>
                  <Input
                    id="title"
                    value={currentPlan.title}
                    onChange={(e) => setCurrentPlan(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assessment title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={currentPlan.duration}
                    onChange={(e) => setCurrentPlan(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="30"
                    max="480"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentPlan.description}
                  onChange={(e) => setCurrentPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this assessment"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Assessment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={currentPlan.instructions}
                  onChange={(e) => setCurrentPlan(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Provide detailed instructions for candidates"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Resources</CardTitle>
              <CardDescription>Add resources and materials needed for the assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPlan.resources.map((resource, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={resource}
                      onChange={(e) => updateResource(index, e.target.value)}
                      placeholder="Enter resource name or URL"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeResource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addResource}>
                  <Plus className="h-4 w-4 me-2" />
                  Add Resource
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Competencies</CardTitle>
              <CardDescription>Choose the competencies to assess in this evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCompetencies.map((competency) => (
                  <div key={competency.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`competency-${competency.id}`}
                          checked={selectedCompetencies.includes(competency.id)}
                          onCheckedChange={(checked) => 
                            handleCompetencySelection(competency.id, checked as boolean)
                          }
                        />
                        <div>
                          <Label htmlFor={`competency-${competency.id}`} className="font-medium">
                            {competency.name}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">{competency.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{competency.competencyType}</Badge>
                      <Badge variant="outline">NQF Level {competency.nqfLevel}</Badge>
                      <Badge variant="outline">{competency.weightage}% Weight</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>Suggested Methods:</strong> {competency.assessmentMethods.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCompetencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Competencies Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentPlan.competencies.map((competency) => (
                    <div key={competency.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{competency.name}</span>
                      <div className="flex gap-2">
                        <Badge>{competency.competencyType}</Badge>
                        <Badge variant="outline">NQF {competency.nqfLevel}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Methods</CardTitle>
              <CardDescription>Select the methods to be used in this assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assessmentMethods.map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`method-${method}`}
                      checked={currentPlan.assessmentMethods.includes(method)}
                      onCheckedChange={(checked) => 
                        handleMethodSelection(method, checked as boolean)
                      }
                    />
                    <Label htmlFor={`method-${method}`}>{method}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {currentPlan.assessmentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Method Configuration</CardTitle>
                <CardDescription>Configure the selected assessment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPlan.assessmentMethods.map((method, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{method}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Time Allocation (minutes)</Label>
                          <Input type="number" defaultValue="30" min="5" max="120" />
                        </div>
                        <div>
                          <Label>Weight (%)</Label>
                          <Input type="number" defaultValue="25" min="5" max="50" />
                        </div>
                        <div>
                          <Label>Difficulty Level</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Criteria</CardTitle>
              <CardDescription>Define how each competency will be scored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentPlan.scoringCriteria.map((criterion) => (
                  <div key={criterion.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{criterion.criterion}</h4>
                      <Badge>Weight: {criterion.weight}%</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Maximum Score</Label>
                        <Input
                          type="number"
                          value={criterion.maxScore}
                          onChange={(e) => updateScoringCriterion(criterion.id, { 
                            maxScore: parseInt(e.target.value) || 100 
                          })}
                        />
                      </div>
                      <div>
                        <Label>Weight (%)</Label>
                        <Input
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => updateScoringCriterion(criterion.id, { 
                            weight: parseInt(e.target.value) || 25 
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Scoring Rubric</Label>
                      <div className="space-y-2">
                        {criterion.rubric.map((level, levelIndex) => (
                          <div key={levelIndex} className="grid grid-cols-4 gap-2 items-center">
                            <Input
                              value={level.level}
                              onChange={(e) => {
                                const newRubric = [...criterion.rubric];
                                newRubric[levelIndex].level = e.target.value;
                                updateScoringCriterion(criterion.id, { rubric: newRubric });
                              }}
                              placeholder="Level name"
                            />
                            <Input
                              type="number"
                              value={level.score}
                              onChange={(e) => {
                                const newRubric = [...criterion.rubric];
                                newRubric[levelIndex].score = parseInt(e.target.value) || 0;
                                updateScoringCriterion(criterion.id, { rubric: newRubric });
                              }}
                              placeholder="Score"
                            />
                            <Input
                              value={level.description}
                              onChange={(e) => {
                                const newRubric = [...criterion.rubric];
                                newRubric[levelIndex].description = e.target.value;
                                updateScoringCriterion(criterion.id, { rubric: newRubric });
                              }}
                              placeholder="Description"
                              className="col-span-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance Checks</CardTitle>
              <CardDescription>Enable quality checks to ensure assessment reliability and fairness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityCheckTemplates.map((template) => (
                  <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`quality-${template.id}`}
                      checked={currentPlan.qualityChecks.some(qc => qc.id === template.id)}
                      onCheckedChange={(checked) => 
                        handleQualityCheckToggle(template.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`quality-${template.id}`} className="font-medium">
                          {template.type}
                        </Label>
                        {template.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NQF Compliance Check</CardTitle>
              <CardDescription>Verify alignment with UAE National Qualifications Framework</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">NQF Level Alignment</span>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Competency Standards</span>
                  </div>
                  <Badge variant="secondary">Compliant</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Assessment Duration</span>
                  </div>
                  <Badge variant="outline">Within Guidelines</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessmentPlanning;
