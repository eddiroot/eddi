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