CREATE TABLE IF NOT EXISTS CourseLesson (
    id SERIAL PRIMARY KEY,
    courseId INT REFERENCES Course(id) ON DELETE CASCADE,
    courseWeek INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    createdAt TIMESTAMP default current_timestamp,
    modifiedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CourseLessonSection (
    id SERIAL PRIMARY KEY,
    courseLessonId INT REFERENCES CourseLesson(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    createdAt TIMESTAMP default current_timestamp,
    modifiedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CourseLessonSectionBlock (
    id SERIAL PRIMARY KEY,
    courseLessonSectionId INT REFERENCES CourseLessonSection(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Text', 'Image', 'Input', 'TextArea', 'MCSingleAnswer', 'MCMultiAnswer')),
    createdAt TIMESTAMP default current_timestamp,
    modifiedAt TIMESTAMP
);