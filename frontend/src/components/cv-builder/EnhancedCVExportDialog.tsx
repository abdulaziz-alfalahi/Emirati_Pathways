import React, { useState, useRef } from 'react';
import { 
  Download, 
  FileText, 
  Printer, 
  Share2, 
  Bot, 
  Star,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { groqClient } from '@/integrations/groq/groqClient';
import { CVData } from '@/types/cv';

interface CVScore {
  overall: number;
  sections: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketAlignment: number;
  atsCompatibility: number;
  strategicAlignment: number;
}

interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt';
  template: 'government' | 'corporate' | 'creative' | 'technical' | 'academic' | 'modern';
  includeAIRecommendations: boolean;
  includeScoreAnalysis: boolean;
  includeCoverLetter: boolean;
  includeInterviewTips: boolean;
  includeStrategicPlan: boolean;
  language: 'en' | 'ar';
}

interface EnhancedCVExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  cvScore?: CVScore;
  onExport: (
    options: ExportOptions,
    extra?: {
      coverLetter?: string;
      interviewTips?: string[];
      strategicPlan?: string;
      scoreAnalysis?: CVScore | null;
    }
  ) => Promise<void>;
}

export const EnhancedCVExportDialog: React.FC<EnhancedCVExportDialogProps> = ({
  isOpen,
  onClose,
  cvData,
  cvScore,
  onExport
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    template: 'corporate',
    includeAIRecommendations: true,
    includeScoreAnalysis: false,
    includeCoverLetter: false,
    includeInterviewTips: false,
    includeStrategicPlan: false,
    language: 'en'
  });
  
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiContent, setAIContent] = useState<{
    coverLetter: string;
    interviewTips: string[];
    careerAdvice: string[];
    strategicPlan: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Enhanced strategic context for all AI content generation
  const getStrategicContext = () => `
You are an expert career strategist specializing in the UAE and Dubai job markets. Your recommendations must align with these critical strategic frameworks:

**STRATEGIC FRAMEWORKS:**

1. **D33 and Talent33** - Making UAE the world's best country by D33
   - Innovation and technology leadership
   - World-class education and healthcare systems
   - Diversified knowledge-based economy
   - Sustainable development and green economy
   - Government excellence and efficiency
   - Cohesive society and preserved identity

2. **D33 Economic Agenda** - Dubai's plan to double economy size by 2033
   - Key Growth Sectors: Technology, tourism, trade, finance, logistics, manufacturing
   - Innovation and entrepreneurship ecosystem
   - Global business and financial hub
   - Sustainable economic growth and diversification
   - Digital transformation and smart city initiatives

3. **Dubai Education 33 (E33) Strategy** - Global education and talent hub
   - World-class education system and infrastructure
   - STEM education and digital literacy advancement
   - Lifelong learning and continuous skill development
   - Innovation and research excellence
   - Global talent attraction and retention

4. **Dubai Talent 2033 Strategy** - Attracting and developing world-class talent
   - Global talent attraction and retention programs
   - Future-ready skills development and training
   - Innovation and entrepreneurship mindset cultivation
   - Cultural diversity and inclusion promotion
   - Excellence and high-performance culture

5. **Dubai South 2033 Strategy** - Future-ready economic zone development
   - Aviation and logistics global hub
   - Advanced manufacturing and technology sectors
   - Smart city and sustainable development
   - Global connectivity and trade facilitation
   - Innovation and research ecosystem

**CONTENT REQUIREMENTS:**
All generated content must:
- Demonstrate clear alignment with these strategic priorities
- Use forward-thinking language that reflects Dubai's transformation goals
- Show cultural intelligence and appreciation for UAE values
- Emphasize innovation, sustainability, and digital transformation
- Highlight contribution to economic diversification and growth
- Reflect multicultural competency and global perspective
- Include specific references to strategic initiatives where relevant
`;

  // Generate AI content for export with strategic alignment
  const generateAIContent = async () => {
    setIsGeneratingAI(true);
    try {
      const strategicContext = getStrategicContext();
      const cvContent = JSON.stringify(cvData, null, 2);
      
      // Generate strategically aligned cover letter
      const coverLetterPrompt = `${strategicContext}

**TASK**: Generate a professional cover letter template based on this CV data that demonstrates strategic alignment with Dubai's vision.

**CV DATA:**
${cvContent}

**COVER LETTER REQUIREMENTS:**
Create a compelling cover letter template that:

1. **Strategic Positioning**: Shows clear alignment with D33 and Talent33 and D33 Economic Agenda
2. **Value Proposition**: Demonstrates contribution to Dubai's transformation goals
3. **Cultural Intelligence**: Reflects understanding of UAE business culture and values
4. **Innovation Focus**: Highlights digital transformation and future-ready capabilities
5. **Global Perspective**: Shows international experience and multicultural competency

**STRUCTURE:**
- **Opening**: Connect personal brand to Dubai's strategic vision
- **Body 1**: Highlight achievements that support strategic frameworks
- **Body 2**: Demonstrate cultural fit and commitment to UAE's future
- **Closing**: Express enthusiasm for contributing to Dubai's 2033 goals

**PLACEHOLDERS**: Include [COMPANY NAME], [POSITION], and [SPECIFIC STRATEGIC INITIATIVE]

Keep it professional, concise (3-4 paragraphs), and strategically focused.`;

      const coverLetter = await groqClient.generateCareerAdvice(coverLetterPrompt);

      // Generate strategic interview tips
      const interviewTipsPrompt = `${strategicContext}

**TASK**: Provide strategic interview tips based on this CV data for the UAE job market.

**CV DATA:**
${cvContent}

**INTERVIEW TIPS REQUIREMENTS:**
Provide 10-12 specific interview tips that:

1. **Strategic Alignment**: Help candidate demonstrate alignment with Dubai's strategic frameworks
2. **Cultural Competency**: Address UAE business culture and professional etiquette
3. **Value Demonstration**: Show how to articulate contribution to strategic goals
4. **Innovation Showcase**: Highlight digital transformation and future-ready thinking
5. **Global Perspective**: Demonstrate international experience and cultural intelligence

**FOCUS AREAS:**
- Questions about strategic vision and long-term goals
- Demonstrating cultural fit and UAE market understanding
- Showcasing innovation and digital transformation experience
- Highlighting sustainability and future-ready mindset
- Discussing contribution to economic diversification
- Addressing multicultural collaboration and global perspective

Format as a JSON array of strings with specific, actionable advice.`;

      const interviewTipsResponse = await groqClient.generateCareerAdvice(interviewTipsPrompt);
      
      // Parse interview tips
      let interviewTips: string[] = [];
      try {
        const tipsMatch = interviewTipsResponse.match(/\[[\s\S]*\]/);
        if (tipsMatch) {
          interviewTips = JSON.parse(tipsMatch[0]);
        }
      } catch {
        interviewTips = interviewTipsResponse
          .split('\n')
          .filter(line => line.trim() && line.length > 20)
          .slice(0, 12);
      }

      // Generate strategic career development plan
      const strategicPlanPrompt = `${strategicContext}

**TASK**: Create a comprehensive 5-year strategic career development plan based on this CV data.

**CV DATA:**
${cvContent}

**STRATEGIC CAREER PLAN REQUIREMENTS:**
Develop a detailed plan that:

1. **Strategic Alignment**: Aligns career progression with D33 and Talent33 and Dubai's 2033 strategies
2. **Skill Development**: Identifies future-ready skills needed for strategic sectors
3. **Network Building**: Outlines networking strategies within Dubai's business ecosystem
4. **Innovation Focus**: Emphasizes digital transformation and innovation capabilities
5. **Cultural Integration**: Shows deeper integration into UAE business culture
6. **Leadership Development**: Builds toward strategic leadership roles

**PLAN STRUCTURE:**
- **Year 1-2**: Immediate strategic positioning and skill development
- **Year 3-4**: Leadership development and strategic project involvement
- **Year 5+**: Senior strategic roles and contribution to national goals

**INCLUDE:**
- Specific skill development priorities aligned with strategic frameworks
- Networking and professional development opportunities
- Industry certifications and continuous learning paths
- Leadership and innovation project involvement
- Cultural competency and language development
- Contribution to UAE's strategic objectives

Provide a comprehensive, actionable plan that positions the candidate for strategic success in Dubai's evolving economy.`;

      const strategicPlan = await groqClient.generateCareerAdvice(strategicPlanPrompt);

      // Generate strategic career advice
      const careerAdvicePrompt = `${strategicContext}

**TASK**: Provide strategic career development recommendations based on this CV data.

**CV DATA:**
${cvContent}

**CAREER ADVICE REQUIREMENTS:**
Provide 8-10 strategic recommendations that:

1. **Strategic Positioning**: Position career within Dubai's strategic frameworks
2. **Skill Development**: Identify future-ready skills for strategic sectors
3. **Network Building**: Build strategic professional relationships
4. **Innovation Leadership**: Develop innovation and digital transformation capabilities
5. **Cultural Excellence**: Deepen UAE business culture understanding
6. **Global Competitiveness**: Maintain international standards and perspective

**FOCUS AREAS:**
- Next career steps aligned with D33 Economic Agenda sectors
- Skill development priorities for Talent 2033 strategy
- Professional development aligned with E33 education goals
- Leadership opportunities in Dubai South 2033 initiatives
- Networking strategies within UAE's strategic ecosystem
- Innovation and sustainability project involvement

Format as a JSON array of strings with specific, actionable strategic advice.`;

      const careerAdviceResponse = await groqClient.generateCareerAdvice(careerAdvicePrompt);
      
      // Parse career advice
      let careerAdvice: string[] = [];
      try {
        const adviceMatch = careerAdviceResponse.match(/\[[\s\S]*\]/);
        if (adviceMatch) {
          careerAdvice = JSON.parse(adviceMatch[0]);
        }
      } catch {
        careerAdvice = careerAdviceResponse
          .split('\n')
          .filter(line => line.trim() && line.length > 20)
          .slice(0, 10);
      }

      setAIContent({
        coverLetter: coverLetter.trim(),
        interviewTips,
        careerAdvice,
        strategicPlan: strategicPlan.trim()
      });
    } catch (error) {
      console.error('Error generating strategic AI content:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportOptions, {
        coverLetter: exportOptions.includeCoverLetter ? aiContent?.coverLetter : undefined,
        interviewTips: exportOptions.includeInterviewTips ? aiContent?.interviewTips : undefined,
        strategicPlan: exportOptions.includeStrategicPlan ? aiContent?.strategicPlan : undefined,
        scoreAnalysis: exportOptions.includeScoreAnalysis ? (cvScore || null) : null,
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Update export option
  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  // Generate AI content when AI options are enabled
  React.useEffect(() => {
    if ((exportOptions.includeCoverLetter || exportOptions.includeInterviewTips || exportOptions.includeStrategicPlan) && !aiContent && !isGeneratingAI) {
      generateAIContent();
    }
  }, [exportOptions.includeCoverLetter, exportOptions.includeInterviewTips, exportOptions.includeStrategicPlan]);

  const templateDescriptions = {
    government: 'UAE government sector compliant format with strategic alignment',
    corporate: 'Professional business format optimized for D33 sectors',
    creative: 'Modern design-focused layout for innovation industries',
    technical: 'Developer/engineer optimized for digital transformation',
    academic: 'Research and education focused for E33 strategy alignment',
    modern: 'Clean contemporary design for future-ready professionals'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Strategic CV Export with AI Enhancements
          </DialogTitle>
          <DialogDescription>
            Export your CV with AI-powered strategic recommendations aligned with D33, Talent33, E33, Talent 2033, and Dubai South 2033
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format">Format & Template</TabsTrigger>
            <TabsTrigger value="ai-content">Strategic AI Content</TabsTrigger>
            <TabsTrigger value="preview">Package Preview</TabsTrigger>
            <TabsTrigger value="export">Strategic Export</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={exportOptions.format} onValueChange={(value) => updateOption('format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
                      <SelectItem value="pdf">PDF (Recommended for UAE market)</SelectItem>
                      <SelectItem value="docx">Word Document (Editable)</SelectItem>
                      <SelectItem value="txt">Plain Text (ATS optimized)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={exportOptions.language} onValueChange={(value) => updateOption('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
                      <SelectItem value="en">English (International business)</SelectItem>
                      <SelectItem value="ar">Arabic (UAE cultural alignment)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Strategic Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strategic Template</CardTitle>
                  <CardDescription>Choose template aligned with your target sector</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={exportOptions.template} onValueChange={(value) => updateOption('template', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
                      {Object.entries(templateDescriptions).map(([key, description]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium capitalize">{key}</div>
                            <div className="text-xs text-gray-500">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-ehrdc-teal" />
                  Strategic AI-Enhanced Content
                </CardTitle>
                <CardDescription>
                  Include AI-generated content aligned with D33 and Talent33, D33, E33, Talent 2033 & Dubai South 2033
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strategic AI Recommendations */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai-recommendations"
                    checked={exportOptions.includeAIRecommendations}
                    onCheckedChange={(checked) => updateOption('includeAIRecommendations', checked)}
                  />
                  <label htmlFor="ai-recommendations" className="text-sm font-medium">
                    Include Strategic AI Improvement Recommendations
                  </label>
                  <Badge className="ml-2 bg-ehrdc-teal text-white">Strategic</Badge>
                </div>

                {/* Strategic Score Analysis */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="score-analysis"
                    checked={exportOptions.includeScoreAnalysis}
                    onCheckedChange={(checked) => updateOption('includeScoreAnalysis', checked)}
                  />
                  <label htmlFor="score-analysis" className="text-sm font-medium">
                    Include Strategic CV Score Analysis
                  </label>
                  {cvScore && (
                    <Badge className="ml-2">
                      Strategic Score: {cvScore.strategicAlignment || cvScore.overall}/100
                    </Badge>
                  )}
                </div>

                {/* Strategic Cover Letter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cover-letter"
                    checked={exportOptions.includeCoverLetter}
                    onCheckedChange={(checked) => updateOption('includeCoverLetter', checked)}
                  />
                  <label htmlFor="cover-letter" className="text-sm font-medium">
                    Generate Strategic Cover Letter Template
                  </label>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">UAE Aligned</Badge>
                  {isGeneratingAI && exportOptions.includeCoverLetter && (
                    <Loader2 className="h-4 w-4 animate-spin text-ehrdc-teal" />
                  )}
                </div>

                {/* Strategic Interview Tips */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interview-tips"
                    checked={exportOptions.includeInterviewTips}
                    onCheckedChange={(checked) => updateOption('includeInterviewTips', checked)}
                  />
                  <label htmlFor="interview-tips" className="text-sm font-medium">
                    Include Strategic Interview Preparation Guide
                  </label>
                  <Badge className="ml-2 bg-green-100 text-green-800">Cultural Intelligence</Badge>
                  {isGeneratingAI && exportOptions.includeInterviewTips && (
                    <Loader2 className="h-4 w-4 animate-spin text-ehrdc-teal" />
                  )}
                </div>

                {/* Strategic Career Development Plan */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="strategic-plan"
                    checked={exportOptions.includeStrategicPlan}
                    onCheckedChange={(checked) => updateOption('includeStrategicPlan', checked)}
                  />
                  <label htmlFor="strategic-plan" className="text-sm font-medium">
                    Include 5-Year Strategic Career Development Plan
                  </label>
                  <Badge className="ml-2 bg-purple-100 text-purple-800">D33 Vision</Badge>
                  {isGeneratingAI && exportOptions.includeStrategicPlan && (
                    <Loader2 className="h-4 w-4 animate-spin text-ehrdc-teal" />
                  )}
                </div>

                {/* Strategic AI Content Preview */}
                {aiContent && (exportOptions.includeCoverLetter || exportOptions.includeInterviewTips || exportOptions.includeStrategicPlan) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-ehrdc-teal" />
                      Strategic AI Content Preview
                    </h4>
                    {exportOptions.includeCoverLetter && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Strategic Cover Letter (excerpt):</p>
                        <p className="text-xs text-gray-700">
                          {aiContent.coverLetter.substring(0, 150)}...
                        </p>
                      </div>
                    )}
                    {exportOptions.includeInterviewTips && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Strategic Interview Tips ({aiContent.interviewTips.length} tips):
                        </p>
                        <p className="text-xs text-gray-700">
                          {aiContent.interviewTips[0]?.substring(0, 100)}...
                        </p>
                      </div>
                    )}
                    {exportOptions.includeStrategicPlan && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">5-Year Strategic Plan (excerpt):</p>
                        <p className="text-xs text-gray-700">
                          {aiContent.strategicPlan.substring(0, 150)}...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Strategic Export Package Preview</CardTitle>
                <CardDescription>
                  Review your comprehensive strategic CV package aligned with Dubai's 2033 vision
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Strategic CV */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-ehrdc-teal" />
                  <div>
                    <p className="font-medium">Strategic Professional CV</p>
                    <p className="text-sm text-gray-600">
                      {exportOptions.template} template in {exportOptions.format.toUpperCase()} format - UAE market optimized
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                </div>

                {/* Strategic AI Recommendations */}
                {exportOptions.includeAIRecommendations && cvScore && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Bot className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">Strategic AI Improvement Recommendations</p>
                      <p className="text-sm text-gray-600">
                        {cvScore.recommendations.length} strategic suggestions aligned with Dubai's vision
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                )}

                {/* Strategic Score Analysis */}
                {exportOptions.includeScoreAnalysis && cvScore && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Star className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">Strategic CV Score Analysis</p>
                      <p className="text-sm text-gray-600">
                        Strategic alignment: {cvScore.strategicAlignment || cvScore.overall}/100 with framework breakdown
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                )}

                {/* Strategic Cover Letter */}
                {exportOptions.includeCoverLetter && aiContent && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">Strategic Cover Letter Template</p>
                      <p className="text-sm text-gray-600">
                        D33 and Talent33 and D33 aligned template with strategic positioning
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                )}

                {/* Strategic Interview Tips */}
                {exportOptions.includeInterviewTips && aiContent && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Lightbulb className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">Strategic Interview Preparation Guide</p>
                      <p className="text-sm text-gray-600">
                        {aiContent.interviewTips.length} UAE market-specific strategic tips
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                )}

                {/* Strategic Career Plan */}
                {exportOptions.includeStrategicPlan && aiContent && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Star className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">5-Year Strategic Career Development Plan</p>
                      <p className="text-sm text-gray-600">
                        Comprehensive plan aligned with D33 and Talent33 and Dubai's 2033 strategies
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ready for Strategic Export</CardTitle>
                <CardDescription>
                  Your strategic CV package is ready for download with full D33 and Talent33 alignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export Strategic CV Package
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Your CV will be exported with strategic alignment to D33 and Talent33, D33, E33, Talent 2033 & Dubai South 2033</p>
                  <p>• All AI-generated content is optimized for the UAE job market and cultural context</p>
                  <p>• The package includes strategic positioning for Dubai's transformational economy</p>
                  <p>• Content demonstrates cultural intelligence and commitment to UAE's strategic goals</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCVExportDialog;

