export type User = {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  username: string;
  avatarUrl: string;
};

export type UserCourse = {
  userId: number;
  courseId: number;
  year: number;
  semester: number;
  role: string;
  isComplete: boolean;
  isArchived: boolean;
};

export type UserCourseJoinCourse = {
  userId: number;
  courseId: number;
  year: number;
  semester: number;
  role: string;
  isComplete: boolean;
  isArchived: boolean;
  institutionId: number;
  name: string;
  description: string;
};

export type CourseThread = {
  id: number;
  userId: number;
  courseId: number;
  title: string;
  type: string;
  content: string;
  createdAt: string;
  modifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLesson = {
  id: number;
  courseId: number;
  courseWeek: number;
  title: string;
  description: string;
  createdAt: string;
  modifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSection = {
  id: number;
  courseLessonId: number;
  title: string;
  createdAt: string;
  modifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSectionBlock = {
  id: number;
  courseLessonSectionId: number;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  modifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSectionWithBlocks = {
  id: number;
  courseLessonId: number;
  title: string;
  createdAt: string;
  modifiedAt: {
    Time: string;
    Valid: boolean;
  };
  blocks: CourseLessonSectionBlock[];
};