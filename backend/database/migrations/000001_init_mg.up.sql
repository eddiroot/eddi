-- Enable foreign key support in SQLite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Institution (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite uses AUTOINCREMENT for serial-like behavior
    name TEXT NOT NULL,
    continent TEXT CHECK (continent IN ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')),
    UNIQUE (name, continent)
);

CREATE TABLE IF NOT EXISTS AppAdmin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institutionId INTEGER NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- SQLite does not enforce length constraints on TEXT
    FOREIGN KEY (institutionId) REFERENCES Institution(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AppUser (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    middleName TEXT,
    lastName TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatarUrl TEXT
);

CREATE TABLE IF NOT EXISTS Course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institutionId INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (institutionId) REFERENCES Institution(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AppUserCourse (
    appUserId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 3),
    role TEXT CHECK (role IN ('Student', 'Moderator', 'Admin')),
    isComplete BOOLEAN DEFAULT 0, -- SQLite uses 0/1 for BOOLEAN
    isArchived BOOLEAN DEFAULT 0,
    PRIMARY KEY (appUserId, courseId, year, semester),
    FOREIGN KEY (appUserId) REFERENCES AppUser(id),
    FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
);
