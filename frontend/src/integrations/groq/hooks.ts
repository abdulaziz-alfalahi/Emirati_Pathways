import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { groqClient } from './groqClient';
import type {
  CareerAdviceRequest,
  CareerAdviceResponse,
  CVAnalysisRequest,
  CVAnalysisResponse,
  JobMatchingRequest,
  JobMatchingResponse,
  InterviewPrepRequest,
  InterviewPrepResponse,
  SkillDevelopmentRequest,
  SkillDevelopmentResponse,
} from './types';

// Hook for career advice generation
export const useCareerAdvice = () => {
  return useMutation<CareerAdviceResponse, Error, CareerAdviceRequest>({
    mutationFn: async ({ prompt, context }) => {
      const advice = await groqClient.generateCareerAdvice(prompt, context);
      return {
        advice,
        timestamp: new Date(),
        confidence: 0.85, // Default confidence score
      };
    },
  });
};

// Hook for CV/Resume analysis
export const useCVAnalysis = () => {
  return useMutation<CVAnalysisResponse, Error, CVAnalysisRequest>({
    mutationFn: async ({ cvContent, targetRole }) => {
      const analysis = await groqClient.analyzeCVResume(cvContent, targetRole);
      return {
        ...analysis,
        timestamp: new Date(),
      };
    },
  });
};

// Hook for job matching
export const useJobMatching = () => {
  return useMutation<JobMatchingResponse, Error, JobMatchingRequest>({
    mutationFn: async ({ userProfile, availableJobs }) => {
      const matching = await groqClient.generateJobMatching(userProfile, availableJobs);
      return {
        ...matching,
        timestamp: new Date(),
      };
    },
  });
};

// Hook for interview preparation
export const useInterviewPrep = () => {
  return useMutation<InterviewPrepResponse, Error, InterviewPrepRequest>({
    mutationFn: async ({ jobRole, company, userBackground }) => {
      const prep = await groqClient.generateInterviewPrep(jobRole, company, userBackground);
      return {
        ...prep,
        timestamp: new Date(),
      };
    },
  });
};

// Hook for skill development recommendations
export const useSkillDevelopment = () => {
  return useMutation<SkillDevelopmentResponse, Error, SkillDevelopmentRequest>({
    mutationFn: async ({ currentSkills, targetRole, industry }) => {
      const development = await groqClient.generateSkillDevelopment(currentSkills, targetRole, industry);
      return {
        ...development,
        timestamp: new Date(),
      };
    },
  });
};

// Hook for managing conversation history
export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<Array<{
    id: string;
    type: 'career-advice' | 'cv-analysis' | 'job-matching' | 'interview-prep' | 'skill-development';
    request: any;
    response: any;
    timestamp: Date;
  }>>([]);

  const addConversation = useCallback((conversation: {
    type: 'career-advice' | 'cv-analysis' | 'job-matching' | 'interview-prep' | 'skill-development';
    request: any;
    response: any;
  }) => {
    const newConversation = {
      id: Date.now().toString(),
      ...conversation,
      timestamp: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
  }, []);

  const clearHistory = useCallback(() => {
    setConversations([]);
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  }, []);

  return {
    conversations,
    addConversation,
    clearHistory,
    removeConversation,
  };
};

// Hook for API key management
export const useGroqConfig = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('groq_api_key') || '';
  });

  const updateApiKey = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('groq_api_key', newApiKey);
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKey('');
    localStorage.removeItem('groq_api_key');
  }, []);

  const isConfigured = Boolean(apiKey || import.meta.env.VITE_GROQ_API_KEY);

  return {
    apiKey,
    updateApiKey,
    clearApiKey,
    isConfigured,
  };
};

// Hook for streaming responses (for real-time chat)
export const useStreamingChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');

  const startStreaming = useCallback(async (prompt: string, context?: any) => {
    setIsStreaming(true);
    setStreamedContent('');

    try {
      // Note: This is a simplified implementation
      // In a real streaming implementation, you would use the Groq streaming API
      const response = await groqClient.generateCareerAdvice(prompt, context);
      
      // Simulate streaming by gradually revealing the content
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setStreamedContent(prev => prev + (i === 0 ? '' : ' ') + words[i]);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setStreamedContent('Sorry, I encountered an error while generating the response.');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const clearContent = useCallback(() => {
    setStreamedContent('');
  }, []);

  return {
    isStreaming,
    streamedContent,
    startStreaming,
    stopStreaming,
    clearContent,
  };
};

