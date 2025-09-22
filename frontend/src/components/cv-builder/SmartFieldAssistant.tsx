import React, { useState, useEffect, useRef } from 'react';
import { Bot, Wand2, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { groqClient } from '@/integrations/groq/groqClient';

interface SmartFieldAssistantProps {
  fieldType: 'summary' | 'achievement' | 'description' | 'skill' | 'objective';
  currentValue: string;
  context?: any; // Additional context like job role, industry, etc.
  onSuggestionApply: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
}

interface FieldSuggestion {
  id: string;
  text: string;
  type: 'complete' | 'improve' | 'alternative';
  confidence: number;
}

export const SmartFieldAssistant: React.FC<SmartFieldAssistantProps> = ({
  fieldType,
  currentValue,
  context,
  onSuggestionApply,
  placeholder,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Enhanced strategic context for all field prompts
  const getStrategicContext = () => `
You are an expert CV writer specializing in the UAE and Dubai job markets. Your recommendations must strategically align with these key frameworks:

**STRATEGIC FRAMEWORKS:**
1. **D33 and Talent33**: Making UAE the world's best country by D33
   - Focus: Innovation, education, economy, government excellence, cohesive society
   - Priorities: Future skills, sustainability, happiness, global competitiveness

2. **D33 Economic Agenda**: Dubai's plan to double economy size by 2033
   - Key Sectors: Technology, tourism, trade, finance, logistics, manufacturing
   - Goals: Innovation hub, global business center, sustainable growth

3. **Dubai Education 33 (E33) Strategy**: Global education and talent hub
   - Focus: World-class education, skill development, lifelong learning
   - Priorities: STEM education, digital literacy, innovation mindset

4. **Dubai Talent 2033 Strategy**: Attracting and developing world-class talent
   - Goals: Global talent attraction, skill development, future-ready workforce
   - Focus: Innovation, entrepreneurship, cultural diversity, excellence

5. **Dubai South 2033 Strategy**: Future-ready economic zone
   - Sectors: Aviation, logistics, technology, manufacturing, services
   - Vision: Smart city, sustainable development, global connectivity

**CONTENT REQUIREMENTS:**
- Demonstrate alignment with these strategic priorities
- Use future-ready language and terminology
- Show cultural intelligence and global perspective
- Emphasize innovation, sustainability, and digital transformation
- Highlight contribution to Dubai's transformation goals
`;

  // Generate field-specific suggestions
  const generateFieldSuggestions = async (value: string) => {
    if (!value.trim() || value.length < 10) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const prompt = createFieldPrompt(fieldType, value, context);
      const response = await groqClient.generateCareerAdvice(prompt);
      
      const parsedSuggestions = parseFieldSuggestions(response);
      setSuggestions(parsedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating field suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create field-specific prompts with strategic alignment
  const createFieldPrompt = (type: string, value: string, ctx?: any): string => {
    const strategicContext = getStrategicContext();
    
    const fieldPrompts = {
      summary: `${strategicContext}

**FIELD TYPE**: Professional Summary
**CURRENT CONTENT**: "${value}"
**CONTEXT**: ${JSON.stringify(ctx, null, 2)}

Create 3 strategically enhanced versions that:

**Strategic Alignment Requirements:**
1. **D33 and Talent33 Connection**: Show contribution to making UAE the world's best country
2. **D33 Economic Agenda**: Align with Dubai's economic transformation and key sectors
3. **E33 Education Strategy**: Demonstrate commitment to continuous learning and skill development
4. **Talent 2033**: Show world-class talent capabilities and innovation mindset
5. **Dubai South 2033**: Connect to future-ready economic development

**Content Enhancement Guidelines:**
- Start with powerful action words that reflect strategic thinking
- Quantify achievements with business impact metrics
- Show cultural intelligence and global perspective
- Highlight innovation, sustainability, and digital transformation
- Demonstrate future-ready skills and adaptability
- Keep to 2-3 impactful sentences
- Use terminology that reflects Dubai's strategic priorities

Return as JSON array: [{"type": "improve", "text": "strategically enhanced version", "confidence": 0.9}]`,

      achievement: `${strategicContext}

**FIELD TYPE**: Professional Achievement
**CURRENT CONTENT**: "${value}"
**CONTEXT**: ${JSON.stringify(ctx, null, 2)}

Create 3 strategically enhanced versions using the STAR method that align with Dubai's strategic frameworks:

**Strategic Enhancement Requirements:**
1. **Situation**: Connect to strategic sector or initiative (D33, E33, Talent 2033, Dubai South 2033)
2. **Task**: Show responsibility aligned with D33 and Talent33 goals
3. **Action**: Demonstrate innovation, sustainability, or digital transformation
4. **Result**: Quantify impact with metrics that support strategic objectives

**Content Guidelines:**
- Use strong action verbs that reflect strategic leadership
- Include specific metrics and business impact numbers
- Show contribution to organizational strategic goals
- Demonstrate cultural intelligence and global collaboration
- Highlight innovation, efficiency, or sustainability outcomes
- Connect to Dubai's economic diversification and growth goals
- Show future-ready thinking and adaptability

Return as JSON array: [{"type": "improve", "text": "strategically enhanced achievement", "confidence": 0.9}]`,

      description: `${strategicContext}

**FIELD TYPE**: Job/Role Description
**CURRENT CONTENT**: "${value}"
**CONTEXT**: ${JSON.stringify(ctx, null, 2)}

Create 3 strategically enhanced versions that position the role within Dubai's strategic context:

**Strategic Positioning Requirements:**
1. **Role Relevance**: Connect responsibilities to D33 Economic Agenda sectors
2. **Strategic Impact**: Show contribution to organizational and national goals
3. **Innovation Focus**: Highlight technology, digital transformation, or sustainability
4. **Global Perspective**: Demonstrate international collaboration and cultural intelligence
5. **Future-Ready Skills**: Show adaptability and continuous learning mindset

**Enhancement Guidelines:**
- Focus on accomplishments and strategic contributions over basic duties
- Use industry-specific keywords relevant to Dubai's priority sectors
- Quantify impact and demonstrate business value creation
- Show progression, growth, and increasing strategic responsibility
- Highlight cross-cultural collaboration and global market understanding
- Connect to UAE's economic diversification and innovation goals
- Demonstrate alignment with sustainability and future-ready practices

Return as JSON array: [{"type": "improve", "text": "strategically enhanced description", "confidence": 0.9}]`,

      skill: `${strategicContext}

**FIELD TYPE**: Skill Description
**CURRENT CONTENT**: "${value}"
**CONTEXT**: ${JSON.stringify(ctx, null, 2)}

Create 3 strategically enhanced versions that position the skill within Dubai's talent strategy:

**Strategic Skill Positioning:**
1. **Talent 2033 Alignment**: Show how skill contributes to world-class talent development
2. **D33 Sector Relevance**: Connect to priority economic sectors and growth areas
3. **Innovation Application**: Demonstrate use in digital transformation or innovation projects
4. **Global Competitiveness**: Show international standards and best practices
5. **Future-Ready Development**: Highlight continuous learning and skill evolution

**Enhancement Guidelines:**
- Include proficiency level with strategic context
- Mention relevant tools, technologies, and methodologies
- Demonstrate practical application in strategic projects
- Show alignment with Dubai's economic and talent priorities
- Highlight certifications and continuous skill development
- Connect to innovation, sustainability, or digital transformation
- Show cultural adaptability and global application

Return as JSON array: [{"type": "improve", "text": "strategically enhanced skill description", "confidence": 0.9}]`,

      objective: `${strategicContext}

**FIELD TYPE**: Career Objective
**CURRENT CONTENT**: "${value}"
**CONTEXT**: ${JSON.stringify(ctx, null, 2)}

Create 3 strategically enhanced versions that align with Dubai's strategic vision:

**Strategic Objective Requirements:**
1. **D33 and Talent33 Alignment**: Show commitment to making UAE the world's best country
2. **D33 Economic Contribution**: Demonstrate value to Dubai's economic transformation
3. **E33 Learning Commitment**: Show dedication to continuous education and skill development
4. **Talent 2033 Excellence**: Position as world-class talent with innovation mindset
5. **Dubai South 2033 Readiness**: Show preparation for future economic opportunities

**Content Guidelines:**
- Align personal career goals with national and emirate strategic objectives
- Show understanding of Dubai's transformation into a global hub
- Demonstrate cultural awareness and appreciation for UAE values
- Highlight commitment to innovation, sustainability, and excellence
- Show desire to contribute to economic diversification and growth
- Reflect multicultural competency and global perspective
- Include specific career goals that support strategic frameworks

Return as JSON array: [{"type": "improve", "text": "strategically enhanced objective", "confidence": 0.9}]`
    };

    return fieldPrompts[type] || fieldPrompts.summary;
  };

  // Parse AI response into suggestions
  const parseFieldSuggestions = (response: string): FieldSuggestion[] => {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any, index: number) => ({
          id: `suggestion-${index}`,
          text: item.text || '',
          type: item.type || 'improve',
          confidence: item.confidence || 0.8
        }));
      }
    } catch (error) {
      console.error('Error parsing field suggestions:', error);
    }

    // Fallback: create suggestions from text
    const lines = response.split('\n').filter(line => line.trim() && line.length > 20);
    return lines.slice(0, 3).map((line, index) => ({
      id: `fallback-${index}`,
      text: line.trim().replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''),
      type: 'improve' as const,
      confidence: 0.7
    }));
  };

  // Debounced suggestion generation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (currentValue && currentValue.length > 10) {
        generateFieldSuggestions(currentValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentValue, fieldType, context]);

  // Apply suggestion
  const applySuggestion = (suggestion: FieldSuggestion) => {
    onSuggestionApply(suggestion.text);
    setIsOpen(false);
    setShowSuggestions(false);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get field type label
  const getFieldTypeLabel = (type: string) => {
    const labels = {
      summary: 'Professional Summary',
      achievement: 'Achievement',
      description: 'Job Description',
      skill: 'Skill',
      objective: 'Career Objective'
    };
    return labels[type] || type;
  };

  return (
    <div className={`relative ${className}`}>
      {/* AI Assistant Trigger */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`absolute right-2 top-2 z-10 h-8 w-8 p-0 ${
              showSuggestions ? 'text-ehrdc-teal bg-ehrdc-teal/10' : 'text-gray-400'
            }`}
            disabled={!currentValue || currentValue.length < 10}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4 text-ehrdc-teal" />
              <span className="font-medium text-sm">Strategic AI Enhancement for {getFieldTypeLabel(fieldType)}</span>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-ehrdc-teal" />
                <span className="ml-2 text-sm text-gray-600">Generating strategic suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge className={getConfidenceColor(suggestion.confidence)}>
                        {Math.round(suggestion.confidence * 100)}% strategic alignment
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {suggestion.text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="flex-1"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(suggestion.text)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bot className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Type more content for strategic AI enhancement</p>
                <p className="text-xs text-gray-400 mt-1">Aligned with Dubai's 2033 strategic frameworks</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Suggestion Indicator */}
      {showSuggestions && suggestions.length > 0 && !isOpen && (
        <div className="absolute -top-1 -right-1 z-20">
          <div className="bg-ehrdc-teal text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {suggestions.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFieldAssistant;

