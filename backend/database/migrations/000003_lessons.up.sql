CREATE TABLE IF NOT EXISTS CourseLesson (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    courseWeek INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedAt TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CourseLessonSection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseLessonId INTEGER NOT NULL,
    title TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedAt TIMESTAMP,
    FOREIGN KEY (courseLessonId) REFERENCES CourseLesson(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CourseLessonSectionBlock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseLessonSectionId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('Text', 'Audio', 'Image', 'Input', 'TextArea', 'MCSingleAnswer', 'MCMultiAnswer')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedAt TIMESTAMP,
    FOREIGN KEY (courseLessonSectionId) REFERENCES CourseLessonSection(id) ON DELETE CASCADE -- Foreign key linking to CourseLessonSection
);
