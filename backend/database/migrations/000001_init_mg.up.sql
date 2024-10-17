-- Create Institution Table
CREATE TABLE IF NOT EXISTS Institution (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    continent CHAR(2) CHECK (continent IN ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'))
);

-- Create AppAdmin Table
CREATE TABLE IF NOT EXISTS AppAdmin (
    id SERIAL PRIMARY KEY,
    institutionId INT REFERENCES Institution(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    passwordHash CHAR(50) NOT NULL
);

-- Create AppUser Table
CREATE TABLE IF NOT EXISTS AppUser (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    middleName VARCHAR(255),
    lastName VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    passwordHash CHAR(50) NOT NULL,
    avatarUrl TEXT
);

-- Create Course Table
CREATE TABLE IF NOT EXISTS Course (
    institutionId INT REFERENCES Institution(id) ON DELETE CASCADE,
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL  -- Removed the extra comma here
);

-- Create AppUserCourse Table
CREATE TABLE IF NOT EXISTS AppUserCourse (
    appUserId INT REFERENCES AppUser(id) ON DELETE CASCADE,
    courseId INT REFERENCES Course(id) ON DELETE CASCADE,
    year INT NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 3),
    role VARCHAR(10) CHECK (role IN ('Student', 'Moderator', 'Admin')),
    isComplete BOOLEAN DEFAULT false,
    isArchived BOOLEAN DEFAULT false,
    PRIMARY KEY (appUserId, courseId, year, semester)
);
