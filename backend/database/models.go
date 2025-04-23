package database

import (
	"database/sql"
	"time"
)

type Institution struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Continent string `json:"continent"`
}

type Admin struct {
	ID            int    `json:"id"`
	InstitutionID int    `json:"institutionId"`
	Username      string `json:"username"`
	Password      string `json:"password"`
}

type User struct {
	ID         int    `json:"id"`
	FirstName  string `json:"firstName"`
	MiddleName string `json:"middleName"`
	LastName   string `json:"lastName"`
	Username   string `json:"username"`
	Password   string `json:"password,omitempty"`
	AvatarUrl  string `json:"avatarUrl"`
}

type Course struct {
	ID            int    `json:"id"`
	InstitutionID int    `json:"institutionId"`
	Name          string `json:"name"`
	Description   string `json:"description"`
}

type UserCourse struct {
	ID         int    `json:"id"`
	UserID     int    `json:"userId"`
	CourseID   int    `json:"courseId"`
	Year       int    `json:"year"`
	Semester   int    `json:"semester"`
	Role       string `json:"role"`
	IsComplete bool   `json:"isComplete"`
	IsArchived bool   `json:"isArchived"`
}

type CourseThread struct {
	ID            int    `json:"id"`
	UserID        int    `json:"userId"`
	CourseID      int    `json:"courseId"`
	Title  string `json:"title"`
	Type string `json:"type"`
	Content 	  string `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	ModifiedAt sql.NullTime `json:"modifiedAt"`
}

type CourseThreadResponse struct {
	ID            int    `json:"id"`
	UserID        int    `json:"userId"`
	CourseThreadID      int    `json:"courseThreadId"`
	Type string `json:"type"`
	Content 	  string `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	ModifiedAt sql.NullTime `json:"modifiedAt"`
}
type CourseLesson struct {
	ID            int    `json:"id"`
	CourseID      int    `json:"courseId"`
	CourseWeek int `json:"courseWeek"`
	Title  string `json:"title"`
	Description string `json:"description"`
	CreatedAt time.Time `json:"createdAt"`
	ModifiedAt sql.NullTime `json:"modifiedAt"`
}
type CourseLessonSection struct {
	ID            int    `json:"id"`
	CourseLessonID      int    `json:"courseLessonId"`
	Title  string `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
	ModifiedAt sql.NullTime `json:"modifiedAt"`
}

type CourseLessonSectionBlock struct {
	ID            int    `json:"id"`
	CourseLessonSectionID      int    `json:"courseLessonSectionId"`
	Title  string `json:"title"`
	Description string `json:"description"`
	Type string `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
	ModifiedAt sql.NullTime `json:"modifiedAt"`
}
