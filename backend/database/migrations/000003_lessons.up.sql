CREATE TABLE IF NOT EXISTS "CourseLesson" (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "courseWeek" INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CourseLessonSection" (
    id SERIAL PRIMARY KEY,
    "courseLessonId" INTEGER NOT NULL,
    title TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("courseLessonId") REFERENCES "CourseLesson"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CourseLessonSectionBlock" (
    id SERIAL PRIMARY KEY,
    "courseLessonSectionId" INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('Text', 'Audio', 'Image', 'Input', 'TextArea', 'MCSingleAnswer', 'MCMultiAnswer')),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("courseLessonSectionId") REFERENCES "CourseLessonSection"(id) ON DELETE CASCADE
);
