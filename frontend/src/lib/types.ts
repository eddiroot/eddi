export type User = {
  ID: number;
  FirstName: string;
  LastName: string;
  MiddleName: string;
  Username: string;
  AvatarUrl: string;
};

export type UserCourse = {
  UserId: number;
  CourseId: number;
  Year: number;
  Semester: number;
  Role: string;
  IsComplete: boolean;
  IsArchived: boolean;
};

export type UserCourseJoinCourse = {
  UserId: number;
  CourseId: number;
  Year: number;
  Semester: number;
  Role: string;
  IsComplete: boolean;
  IsArchived: boolean;
  InstitutionId: number;
  Name: string;
  Description: string;
};

export type CourseThread = {
  ID: number;
  UserId: number;
  CourseId: number;
  Title: string;
  Type: string;
  Content: string;
  CreatedAt: string;
  ModifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseThreadResponse = {
  ID: number;
  UserId: number;
  CourseThreadId: number;
  Type: string;
  Content: string;
  CreatedAt: string;
  ModifiedAt: {
    Time: string;
    Valid: boolean;
  };
  Responses: CourseThreadResponse[];
};

export type CourseThreadWithResponses = CourseThread & {
  Responses: CourseThreadResponse[];
};

export type CourseLesson = {
  ID: number;
  CourseId: number;
  CourseWeek: number;
  Title: string;
  Description: string;
  CreatedAt: string;
  ModifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSection = {
  ID: number;
  CourseLessonId: number;
  Title: string;
  CreatedAt: string;
  ModifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSectionBlock = {
  ID: number;
  CourseLessonSectionId: number;
  Title: string;
  Description: string;
  Type: string;
  CreatedAt: string;
  ModifiedAt: {
    Time: string;
    Valid: boolean;
  };
};

export type CourseLessonSectionWithBlocks = CourseLessonSection & {
  Blocks: CourseLessonSectionBlock[];
};
