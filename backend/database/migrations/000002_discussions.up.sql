CREATE TABLE IF NOT EXISTS "CourseThread" (
    id SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "CourseThreadResponse" (
    id SERIAL PRIMARY KEY,
    "courseThreadId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    content TEXT NOT NULL,
    "parentResponseId" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("courseThreadId") REFERENCES "CourseThread"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"(id),
    FOREIGN KEY ("parentResponseId") REFERENCES "CourseThreadResponse"(id) ON DELETE CASCADE
);