import { BaseLMSService } from './baseLMSService';
import type { Quiz, CreateQuizData, QuizQuestion, QuizQuestionData, QuizAttempt } from '@/types/lms';

export class QuizService extends BaseLMSService {
  async createQuiz(lessonId: string, quizData: CreateQuizData): Promise<Quiz> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          ...quizData,
          lesson_id: lessonId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'createQuiz');
    }
  }

  async addQuizQuestion(quizId: string, questionData: QuizQuestionData): Promise<QuizQuestion> {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          ...questionData,
          quiz_id: quizId,
          order_index: 1 // Will be updated based on existing questions
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        options: data.options as Record<string, any>,
        correct_answer: data.correct_answer as Record<string, any>
      };
    } catch (error) {
      throw this.handleError(error, 'addQuizQuestion');
    }
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        options: item.options as Record<string, any>,
        correct_answer: item.correct_answer as Record<string, any>
      }));
    } catch (error) {
      throw this.handleError(error, 'getQuizQuestions');
    }
  }

  async submitQuizAttempt(
    quizId: string,
    enrollmentId: string,
    answers: Record<string, any>,
    score: number,
    maxScore: number
  ): Promise<QuizAttempt> {
    try {
      const user = await this.getCurrentUser();

      // Get attempt number
      const { data: existingAttempts } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = existingAttempts?.length ? existingAttempts[0].attempt_number + 1 : 1;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          enrollment_id: enrollmentId,
          score,
          max_score: maxScore,
          percentage: (score / maxScore) * 100,
          answers,
          attempt_number: attemptNumber,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        answers: data.answers as Record<string, any>
      };
    } catch (error) {
      throw this.handleError(error, 'submitQuizAttempt');
    }
  }
}

export const quizService = new QuizService();
