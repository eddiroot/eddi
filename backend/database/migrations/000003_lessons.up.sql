CREATE TABLE IF NOT EXISTS CourseLesson (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite uses AUTOINCREMENT for serial-like behavior
    courseId INTEGER NOT NULL, -- Foreign key reference to Course
    courseWeek INTEGER NOT NULL, -- Non-null course week
    title TEXT NOT NULL, -- Lesson title
    description TEXT, -- Optional lesson description
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Default to current timestamp
    modifiedAt TIMESTAMP, -- Optional timestamp for modifications
    FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE -- Foreign key linking to Course
);

CREATE TABLE IF NOT EXISTS CourseLessonSection (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite uses AUTOINCREMENT for serial-like behavior
    courseLessonId INTEGER NOT NULL, -- Foreign key reference to CourseLesson
    title TEXT NOT NULL, -- Section title
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Default to current timestamp
    modifiedAt TIMESTAMP, -- Optional timestamp for modifications
    FOREIGN KEY (courseLessonId) REFERENCES CourseLesson(id) ON DELETE CASCADE -- Foreign key linking to CourseLesson
);

CREATE TABLE IF NOT EXISTS CourseLessonSectionBlock (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite uses AUTOINCREMENT for serial-like behavior
    courseLessonSectionId INTEGER NOT NULL, -- Foreign key reference to CourseLessonSection
    title TEXT NOT NULL, -- Block title
    description TEXT NOT NULL, -- Block description
    type TEXT CHECK (type IN ('Text', 'Audio', 'Image', 'Input', 'TextArea', 'MCSingleAnswer', 'MCMultiAnswer')), -- Constraint for block types
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Default to current timestamp
    modifiedAt TIMESTAMP, -- Optional timestamp for modifications
    FOREIGN KEY (courseLessonSectionId) REFERENCES CourseLessonSection(id) ON DELETE CASCADE -- Foreign key linking to CourseLessonSection
);
