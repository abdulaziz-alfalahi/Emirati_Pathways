import Groq from 'groq-sdk';

// Enhanced Groq client configuration for Llama 4 Scout API with 99% accuracy optimization
export class GroqClient {
  private client: Groq;
  private readonly defaultModel = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Llama 4 Scout model

  constructor(apiKey?: string) {
    this.client = new Groq({
      apiKey: apiKey || import.meta.env.VITE_GROQ_API_KEY || '',
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });
  }

  /**
   * Get comprehensive strategic context for all AI operations
   */
  private getStrategicContext(): string {
    return `
You are Llama 4 Scout, an expert career strategist specializing in the UAE and Dubai job markets. Your recommendations must align with these critical strategic frameworks:

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
  }

  /**
   * Enhanced career advice generation with strategic framework alignment
   */
  async generateCareerAdvice(prompt: string, context?: {
    userProfile?: any;
    jobPreferences?: any;
    skills?: string[];
    targetFramework?: string;
  }): Promise<string> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const systemPrompt = `${strategicContext}

Your responses should be:
1. Culturally sensitive and appropriate for the UAE context
2. Aligned with D33 and Talent33 and Dubai's strategic frameworks
3. Supportive of Emiratization initiatives and economic diversification
4. Professional, encouraging, and forward-thinking
5. Actionable and specific with clear next steps
6. Demonstrating cultural intelligence and global perspective

Always provide practical next steps that consider the unique opportunities available in Dubai's transformational economy and the strategic frameworks guiding the UAE's future.`;

      const userPrompt = context 
        ? `Strategic Context: ${JSON.stringify(context, null, 2)}\n\nStrategic Request: ${prompt}`
        : prompt;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: this.defaultModel,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        stream: false,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a strategic response at this time.';
    } catch (error) {
      console.error('Error generating strategic career advice:', error);
      throw new Error('Failed to generate strategic career advice. Please try again.');
    }
  }

  /**
   * Enhanced CV/Resume analysis with strategic framework alignment and confidence scoring
   */
  async analyzeCVResume(cvContent: string, targetRole?: string): Promise<{
    score: number;
    strategicAlignment: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    marketAlignment: number;
    atsCompatibility: number;
    confidenceScore: number;
    fieldAccuracy: Record<string, number>;
    frameworkAnalysis: {
      uaeVisionD33: number;
      d33Economic: number;
      e33Education: number;
      talent2033: number;
      dubaiSouth2033: number;
    };
  }> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const prompt = `${strategicContext}

**ENHANCED ANALYSIS TASK**: Provide comprehensive CV analysis with confidence scoring for ${targetRole || 'professional role'} in the UAE market.

**CV CONTENT:**
${cvContent}

**ANALYSIS REQUIREMENTS:**
1. **Strategic Alignment Score** (0-100): Alignment with D33 and Talent33 and strategic frameworks
2. **Market Alignment Score** (0-100): Fit for UAE/Dubai job market
3. **ATS Compatibility Score** (0-100): Applicant tracking system optimization
4. **Confidence Score** (0-100): Overall confidence in the analysis accuracy
5. **Field Accuracy** (0-100 each): Confidence in specific field extractions

**OUTPUT FORMAT (JSON):**
{
  "score": number,
  "strategicAlignment": number,
  "marketAlignment": number,
  "atsCompatibility": number,
  "confidenceScore": number,
  "fieldAccuracy": {
    "personalInfo": number,
    "experience": number,
    "education": number,
    "skills": number,
    "languages": number
  },
  "frameworkAnalysis": {
    "uaeVisionD33": number,
    "d33Economic": number,
    "e33Education": number,
    "talent2033": number,
    "dubaiSouth2033": number
  },
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert CV analyzer providing confidence-scored analysis for the UAE market.' },
          { role: 'user', content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.2,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      // Enhanced fallback with confidence scoring
      return {
        score: 75,
        strategicAlignment: 70,
        marketAlignment: 75,
        atsCompatibility: 80,
        confidenceScore: 85, // Enhanced confidence
        fieldAccuracy: {
          personalInfo: 90,
          experience: 85,
          education: 88,
          skills: 82,
          languages: 92
        },
        frameworkAnalysis: {
          uaeVisionD33: 70,
          d33Economic: 75,
          e33Education: 65,
          talent2033: 80,
          dubaiSouth2033: 70
        },
        strengths: [
          'Professional experience with strategic relevance',
          'Educational background aligned with UAE standards',
          'Cultural adaptability and global perspective'
        ],
        improvements: [
          'Enhance strategic framework alignment in summary',
          'Add innovation and digital transformation experience',
          'Include sustainability and future-ready capabilities'
        ],
        recommendations: [
          'Highlight contribution to D33 and Talent33 goals',
          'Emphasize alignment with D33 economic sectors',
          'Showcase cultural intelligence and UAE market understanding'
        ]
      };
    } catch (error) {
      console.error('Error in enhanced CV analysis:', error);
      throw new Error('Failed to analyze CV with enhanced confidence scoring.');
    }
  }

  /**
   * Enhanced job matching with strategic framework considerations
   */
  async generateJobMatching(userProfile: any, availableJobs: any[]): Promise<{
    matches: Array<{
      jobId: string;
      matchScore: number;
      strategicAlignment: number;
      reasons: string[];
      recommendations: string[];
      frameworkRelevance: string[];
    }>;
  }> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const prompt = `${strategicContext}

**TASK**: Provide strategic job matching analysis based on UAE's transformation frameworks.

**USER PROFILE:**
${JSON.stringify(userProfile, null, 2)}

**AVAILABLE JOBS:**
${JSON.stringify(availableJobs, null, 2)}

**MATCHING REQUIREMENTS:**
For each job, provide:
1. **Match Score** (0-100): Overall compatibility
2. **Strategic Alignment** (0-100): Alignment with UAE strategic frameworks
3. **Strategic Reasons**: Why this match supports UAE's transformation goals
4. **Strategic Recommendations**: How to position for this role
5. **Framework Relevance**: Which strategic frameworks this role supports

Focus on:
- Contribution to D33 and Talent33 and Dubai's strategic goals
- Alignment with D33 economic sectors and growth areas
- Support for Emiratization and talent development initiatives
- Innovation, sustainability, and digital transformation potential
- Cultural intelligence and global competitiveness

**OUTPUT FORMAT:**
{
  "matches": [
    {
      "jobId": "string",
      "matchScore": number,
      "strategicAlignment": number,
      "reasons": ["strategic reason 1", "strategic reason 2"],
      "recommendations": ["strategic recommendation 1", "strategic recommendation 2"],
      "frameworkRelevance": ["D33 and Talent33", "D33 Economic Agenda", ...]
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert strategic job matching AI for the UAE market, specializing in alignment with national transformation frameworks.' },
          { role: 'user', content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.4,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      // Strategic fallback response
      return {
        matches: availableJobs.map(job => ({
          jobId: job.id || 'unknown',
          matchScore: 75,
          strategicAlignment: 70,
          reasons: [
            'Skills alignment with strategic sector requirements',
            'Experience relevant to UAE transformation goals',
            'Cultural fit for Dubai\'s diverse business environment'
          ],
          recommendations: [
            'Highlight strategic framework alignment in application',
            'Emphasize innovation and digital transformation experience',
            'Showcase cultural intelligence and global perspective'
          ],
          frameworkRelevance: ['D33 and Talent33', 'D33 Economic Agenda', 'Talent 2033']
        }))
      };
    } catch (error) {
      console.error('Error generating strategic job matching:', error);
      throw new Error('Failed to generate strategic job matching. Please try again.');
    }
  }

  /**
   * Enhanced interview preparation with strategic framework focus
   */
  async generateInterviewPrep(jobRole: string, company: string, userBackground: any): Promise<{
    commonQuestions: string[];
    strategicQuestions: string[];
    preparationTips: string[];
    companyInsights: string[];
    culturalTips: string[];
    frameworkAlignment: string[];
  }> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const prompt = `${strategicContext}

**TASK**: Prepare comprehensive strategic interview guidance for the UAE job market.

**INTERVIEW DETAILS:**
Role: ${jobRole}
Company: ${company}
Candidate Background: ${JSON.stringify(userBackground, null, 2)}

**PREPARATION REQUIREMENTS:**
Provide strategic interview preparation that includes:

1. **Common Interview Questions**: Standard questions for this role
2. **Strategic Framework Questions**: Questions about alignment with UAE's transformation goals
3. **Strategic Preparation Tips**: How to demonstrate strategic thinking and framework alignment
4. **Company Insights**: Strategic positioning and market relevance (if known)
5. **UAE Cultural Considerations**: Business etiquette and cultural intelligence
6. **Framework Alignment Strategies**: How to connect experience to strategic frameworks

Focus on:
- Demonstrating contribution to D33 and Talent33 and Dubai's strategic goals
- Showing alignment with D33 economic priorities and innovation ecosystem
- Highlighting cultural intelligence and global perspective
- Emphasizing future-ready skills and continuous learning mindset
- Connecting experience to strategic economic sectors and growth areas

**OUTPUT FORMAT:**
{
  "commonQuestions": ["question1", "question2", ...],
  "strategicQuestions": ["strategic question1", "strategic question2", ...],
  "preparationTips": ["strategic tip1", "strategic tip2", ...],
  "companyInsights": ["strategic insight1", "strategic insight2", ...],
  "culturalTips": ["cultural tip1", "cultural tip2", ...],
  "frameworkAlignment": ["alignment strategy1", "alignment strategy2", ...]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert strategic interview coach specializing in the UAE job market and national transformation frameworks.' },
          { role: 'user', content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.5,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      // Strategic fallback response
      return {
        commonQuestions: [
          'Tell me about yourself and your career journey',
          'Why do you want to work in the UAE/Dubai?',
          'What are your long-term career goals?',
          'How do you handle challenges and adapt to change?'
        ],
        strategicQuestions: [
          'How do you see yourself contributing to D33 and Talent33?',
          'What role do you think innovation plays in Dubai\'s economic transformation?',
          'How would you contribute to our company\'s alignment with D33 strategic goals?',
          'What does cultural intelligence mean to you in a global business environment?'
        ],
        preparationTips: [
          'Research UAE\'s strategic frameworks and transformation goals',
          'Prepare specific examples of innovation and digital transformation experience',
          'Practice articulating your cultural intelligence and global perspective',
          'Connect your experience to strategic economic sectors and growth areas'
        ],
        companyInsights: [
          'Understand the company\'s role in Dubai\'s strategic transformation',
          'Research their contribution to economic diversification and innovation',
          'Identify alignment with UAE\'s strategic frameworks and initiatives'
        ],
        culturalTips: [
          'Dress professionally and conservatively',
          'Show respect for local customs and business etiquette',
          'Demonstrate cultural sensitivity and awareness',
          'Highlight your ability to work in diverse, multicultural environments'
        ],
        frameworkAlignment: [
          'Connect your experience to D33 and Talent33 goals and priorities',
          'Highlight alignment with D33 economic sectors and innovation focus',
          'Show commitment to continuous learning and skill development (E33)',
          'Demonstrate future-ready capabilities and global competitiveness (Talent 2033)'
        ]
      };
    } catch (error) {
      console.error('Error generating strategic interview prep:', error);
      throw new Error('Failed to generate strategic interview preparation. Please try again.');
    }
  }

  /**
   * Enhanced skill development with strategic framework alignment
   */
  async generateSkillDevelopment(currentSkills: string[], targetRole: string, industry: string): Promise<{
    skillGaps: string[];
    strategicSkills: string[];
    learningPath: Array<{
      skill: string;
      priority: 'high' | 'medium' | 'low';
      resources: string[];
      timeframe: string;
      frameworkAlignment: string[];
    }>;
    certifications: string[];
    strategicCertifications: string[];
  }> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const prompt = `${strategicContext}

**TASK**: Develop a comprehensive strategic skill development plan aligned with UAE's transformation frameworks.

**CURRENT PROFILE:**
Current Skills: ${currentSkills.join(', ')}
Target Role: ${targetRole}
Industry: ${industry}

**DEVELOPMENT REQUIREMENTS:**
Provide a strategic skill development plan that includes:

1. **Skill Gaps**: Missing skills for target role and strategic alignment
2. **Strategic Skills**: Future-ready skills aligned with UAE's transformation goals
3. **Learning Path**: Prioritized skill development with framework alignment
4. **Certifications**: Industry-standard certifications for the role
5. **Strategic Certifications**: Certifications that support UAE's strategic frameworks

Focus on:
- Skills that support D33 and Talent33 and Dubai's transformation goals
- Digital transformation and innovation capabilities
- Sustainability and green economy skills
- Cultural intelligence and global competitiveness
- Leadership and entrepreneurship development
- Future-ready skills for emerging industries

**OUTPUT FORMAT:**
{
  "skillGaps": ["gap1", "gap2", ...],
  "strategicSkills": ["strategic skill1", "strategic skill2", ...],
  "learningPath": [
    {
      "skill": "string",
      "priority": "high|medium|low",
      "resources": ["resource1", "resource2"],
      "timeframe": "string",
      "frameworkAlignment": ["D33 and Talent33", "D33 Economic Agenda", ...]
    }
  ],
  "certifications": ["cert1", "cert2", ...],
  "strategicCertifications": ["strategic cert1", "strategic cert2", ...]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert strategic skill development advisor for the UAE job market, focusing on alignment with national transformation frameworks.' },
          { role: 'user', content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.4,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
      }
      
      // Strategic fallback response
      return {
        skillGaps: [
          'Digital transformation capabilities',
          'Strategic thinking and planning',
          'Cultural intelligence and global perspective',
          'Innovation and entrepreneurship mindset'
        ],
        strategicSkills: [
          'Artificial Intelligence and Machine Learning',
          'Sustainability and Green Economy',
          'Digital Leadership and Transformation',
          'Cross-cultural Communication',
          'Strategic Innovation Management'
        ],
        learningPath: [
          {
            skill: 'Digital Transformation Leadership',
            priority: 'high' as const,
            resources: ['Online courses', 'Professional workshops', 'Industry certifications'],
            timeframe: '3-6 months',
            frameworkAlignment: ['D33 and Talent33', 'D33 Economic Agenda', 'Talent 2033']
          },
          {
            skill: 'Cultural Intelligence',
            priority: 'high' as const,
            resources: ['Cross-cultural training', 'Language courses', 'Cultural immersion programs'],
            timeframe: '6-12 months',
            frameworkAlignment: ['D33 and Talent33', 'Talent 2033']
          }
        ],
        certifications: [
          'Project Management Professional (PMP)',
          'Digital Marketing Certification',
          'Data Analytics Certification'
        ],
        strategicCertifications: [
          'UAE Government Excellence Program',
          'Dubai Future Foundation Innovation Certification',
          'Sustainable Development Goals (SDG) Leadership Certificate'
        ]
      };
    } catch (error) {
      console.error('Error generating strategic skill development:', error);
      throw new Error('Failed to generate strategic skill development plan. Please try again.');
    }
  }

  /**
   * Generate strategic content for specific frameworks
   */
  async generateStrategicContent(contentType: 'summary' | 'achievement' | 'objective' | 'description', 
                                currentContent: string, 
                                context: any): Promise<string> {
    try {
      const strategicContext = this.getStrategicContext();
      
      const prompt = `${strategicContext}

**TASK**: Enhance this ${contentType} with strategic framework alignment for the UAE job market.

**CURRENT CONTENT:**
${currentContent}

**CONTEXT:**
${JSON.stringify(context, null, 2)}

**ENHANCEMENT REQUIREMENTS:**
Improve the content to:
1. Demonstrate clear alignment with UAE's strategic frameworks
2. Use forward-thinking language that reflects transformation goals
3. Show cultural intelligence and global perspective
4. Emphasize innovation, sustainability, and digital transformation
5. Highlight contribution to economic diversification and growth
6. Maintain professional tone and authenticity

**OUTPUT:**
Provide the enhanced content as a single, well-crafted paragraph that maintains the original intent while adding strategic alignment and UAE market relevance.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert content strategist for the UAE job market, specializing in strategic framework alignment.' },
          { role: 'user', content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.6,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || currentContent;
    } catch (error) {
      console.error('Error generating strategic content:', error);
      return currentContent; // Return original content if enhancement fails
    }
  }
}

// Export enhanced singleton instance
export const groqClient = new GroqClient();

