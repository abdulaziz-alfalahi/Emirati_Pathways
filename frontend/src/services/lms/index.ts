
import { courseService } from './courseService';
import { moduleService } from './moduleService';
import { enrollmentService } from './enrollmentService';
import { quizService } from './quizService';
import { certificateService } from './certificateService';
import type { 
  Course, CreateCourseData, CourseStatus, CourseModule, CreateModuleData,
  Lesson, CreateLessonData, Quiz, CreateQuizData, QuizQuestion, QuizQuestionData,
  CourseEnrollment, LessonProgress, QuizAttempt, Certificate
} from '@/types/lms';

class LMSService {
  // Course management
  createCourse = courseService.createCourse.bind(courseService);
  getCourses = courseService.getCourses.bind(courseService);
  getCourse = courseService.getCourse.bind(courseService);
  updateCourse = courseService.updateCourse.bind(courseService);

  // Module management
  createModule = moduleService.createModule.bind(moduleService);
  getCourseModules = moduleService.getCourseModules.bind(moduleService);

  // Lesson management
  createLesson = moduleService.createLesson.bind(moduleService);
  getModuleLessons = moduleService.getModuleLessons.bind(moduleService);

  // Quiz management
  createQuiz = quizService.createQuiz.bind(quizService);
  addQuizQuestion = quizService.addQuizQuestion.bind(quizService);
  getQuizQuestions = quizService.getQuizQuestions.bind(quizService);

  // Enrollment management
  enrollInCourse = enrollmentService.enrollInCourse.bind(enrollmentService);
  getUserEnrollments = enrollmentService.getUserEnrollments.bind(enrollmentService);

  // Progress tracking
  updateLessonProgress = enrollmentService.updateLessonProgress.bind(enrollmentService);
  getUserLessonProgress = enrollmentService.getUserLessonProgress.bind(enrollmentService);

  // Quiz attempts
  submitQuizAttempt = quizService.submitQuizAttempt.bind(quizService);

  // Certificate generation
  generateCertificate = certificateService.generateCertificate.bind(certificateService);
  getUserCertificates = certificateService.getUserCertificates.bind(certificateService);
}

export const lmsService = new LMSService();

// Export individual services for direct access if needed
export {
  courseService,
  moduleService,
  enrollmentService,
  quizService,
  certificateService
};
