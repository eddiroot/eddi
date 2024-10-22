CREATE TABLE IF NOT EXISTS CourseThread (
    id SERIAL PRIMARY KEY,
    appUserId INT REFERENCES AppUser(id),
    courseId INT REFERENCES Course(id) ON DELETE CASCADE,
    title VARCHAR(255),
    type VARCHAR(20) CHECK (type IN ('Question', 'Post')),
    content TEXT,
    createdAt TIMESTAMP default current_timestamp,
    modifiedAt TIMESTAMP
);