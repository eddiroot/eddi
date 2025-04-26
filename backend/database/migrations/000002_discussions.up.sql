CREATE TABLE IF NOT EXISTS CourseThread (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    courseId INTEGER NOT NULL,
    title TEXT,
    type TEXT CHECK (type IN ('Question', 'Post')),
    content TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedAt TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CourseThreadResponse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    courseThreadId INTEGER NOT NULL,
    type TEXT CHECK (type IN ('Comment', 'Answer')),
    content TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedAt TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (courseThreadId) REFERENCES CourseThread(id) ON DELETE CASCADE
);