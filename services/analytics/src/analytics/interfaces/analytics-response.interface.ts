/**
 * Interfaces for the response objects from the analytics service
 */

// User progress interface
export interface UserProgress {
  userId: number;
  completedCourses: number;
  totalCourses: number;
  completedTests: number;
  totalTests: number;
  averageScore: number;
  timeSpent: string;
  progressTrend: {
    date: string;
    progress: number;
  }[];
  completedChapters: number[];
  totalEventsTracked: number;
  tests: Record<
    string,
    {
      started: boolean;
      completed: boolean;
      score: number | null;
      passed?: boolean;
    }
  >;
}

// Question difficulty interface
export interface QuestionDifficulty {
  correctRate: number;
  difficultyLevel: string;
  totalAttempts: number;
}

// Test statistics interface
export interface TestStatistics {
  testId: number;
  attemptCount: number;
  averageScore: number;
  passRate: number;
  questionDifficulty: Record<string, QuestionDifficulty>;
}

// Course completion stats interface
export interface CourseCompletionStat {
  starts: number;
  completions: number;
  completionRate: number;
}

// Course completion rates interface
export interface CourseCompletionRates {
  [courseId: string]: CourseCompletionStat;
}

// Test performance interface
export interface TestPerformance {
  attempts: number;
  passRate: number;
  averageScore: number;
}

// Aggregate performance overview interface
export interface AggregatePerformanceOverview {
  totalTestsTaken: number;
  overallPassRate: number;
  averageScore: number;
  averageTimeSpentSeconds: number;
}

// Aggregate performance report interface
export interface AggregatePerformanceReport {
  overview: AggregatePerformanceOverview;
  mostDifficultTests: Array<TestPerformance & { testId: number }>;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

// Individual performance metrics interface
export interface IndividualPerformanceMetrics {
  totalTestsTaken: number;
  testsPassed: number;
  overallPassRate: number;
  averageScore: number;
}

// Individual performance progress interface
export interface IndividualPerformanceProgress {
  completedCourses: number;
  completedChapters: number;
}

// Recent test interface
export interface RecentTest {
  testId: number;
  score: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: Date;
}

// Individual performance report interface
export interface IndividualPerformanceReport {
  userId: number;
  metrics: IndividualPerformanceMetrics;
  progress: IndividualPerformanceProgress;
  recentTests: RecentTest[];
  period: {
    startDate?: string;
    endDate?: string;
  };
}

// Export data interface
export interface ExportDataResponse {
  exportedAt: string;
  period: {
    startDate?: string;
    endDate?: string;
  };
  eventTypes?: string[];
  totalEvents: number;
  events: any[]; // We'll keep this as any[] since events can have varying structures
}
