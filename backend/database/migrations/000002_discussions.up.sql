CREATE TABLE IF NOT EXISTS CourseThread (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite uses AUTOINCREMENT for serial-like behavior
    appUserId INTEGER, -- Foreign key reference to AppUser
    courseId INTEGER NOT NULL, -- Foreign key reference to Course
    title TEXT, -- SQLite uses TEXT instead of VARCHAR
    type TEXT CHECK (type IN ('Question', 'Post')), -- Check constraint for type values
    content TEXT, -- Content field for larger text
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Default value for createdAt
    modifiedAt TIMESTAMP, -- Optional timestamp for modifications
    FOREIGN KEY (appUserId) REFERENCES AppUser(id), -- Foreign key linking to AppUser
    FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE -- Foreign key linking to Course
);
