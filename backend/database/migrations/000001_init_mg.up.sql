CREATE TABLE IF NOT EXISTS Institution (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    continent CHAR(2) CHECK (continent IN ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')),
    UNIQUE (name, continent)
);

CREATE TABLE IF NOT EXISTS AppAdmin (
    id SERIAL PRIMARY KEY,
    institutionId INT REFERENCES Institution(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    password CHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS AppUser (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    middleName VARCHAR(255),
    lastName VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password CHAR(60) NOT NULL,
    avatarUrl TEXT
);

CREATE TABLE IF NOT EXISTS Course (
    id SERIAL PRIMARY KEY,
    institutionId INT REFERENCES Institution(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL  -- Removed the extra comma here
);

CREATE TABLE IF NOT EXISTS AppUserCourse (
    appUserId INT REFERENCES AppUser(id),
    courseId INT REFERENCES Course(id) ON DELETE CASCADE,
    year INT NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 3),
    role VARCHAR(10) CHECK (role IN ('Student', 'Moderator', 'Admin')),
    isComplete BOOLEAN DEFAULT false,
    isArchived BOOLEAN DEFAULT false,
    PRIMARY KEY (appUserId, courseId, year, semester)
);
