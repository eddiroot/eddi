CREATE TABLE IF NOT EXISTS "Institution" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    continent TEXT CHECK (continent IN ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    UNIQUE (name, continent)
);

CREATE TABLE IF NOT EXISTS "Admin" (
    id SERIAL PRIMARY KEY,
    "institutionId" INTEGER NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("institutionId") REFERENCES "Institution"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Course" (
    id SERIAL PRIMARY KEY,
    "institutionId" INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("institutionId") REFERENCES "Institution"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserCourse" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 3),
    role TEXT CHECK (role IN ('Student', 'Moderator', 'Admin')),
    "isComplete" BOOLEAN DEFAULT FALSE,
    "isArchived" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id),
    FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE
);
