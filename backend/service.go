package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // PostgreSQL driver
)

var db *sql.DB

func InitialiseDB() {
	var err error
	db, err = sql.Open("postgres", "postgresql://postgres:password@localhost:5432/opened?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Test the database connection
	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to the database successfully!")
}

// Institution Operations
func CreateInstitution(name, continent string) (int, error) {
	var id int
	query := `INSERT INTO Institution (name, continent) VALUES ($1, $2) RETURNING id`
	err := db.QueryRow(query, name, continent).Scan(&id)
	return id, err
}

func GetInstitutions() ([]Institution, error) {
	rows, err := db.Query(`SELECT id, name, continent FROM Institution`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var institutions []Institution
	for rows.Next() {
		var institution Institution
		if err := rows.Scan(&institution.ID, &institution.Name, &institution.Continent); err != nil {
			return nil, err
		}
		institutions = append(institutions, institution)
	}
	return institutions, nil
}

func GetInstitutionByID(id int) (Institution, error) {
	var institution Institution
	query := `SELECT id, name, continent FROM Institution WHERE id = $1`
	err := db.QueryRow(query, id).Scan(&institution.ID, &institution.Name, &institution.Continent)
	return institution, err
}

func UpdateInstitution(id int, name, continent string) error {
	query := `UPDATE Institution SET name = $1, continent = $2 WHERE id = $3`
	_, err := db.Exec(query, name, continent, id)
	return err
}

func DeleteInstitution(id int) error {
	query := `DELETE FROM Institution WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// Admin Operations
func CreateAdmin(institutionID int, username, password string) (int, error) {
	var id int
	query := `INSERT INTO Admin (institutionId, username, password) VALUES ($1, $2, $3) RETURNING id`
	err := db.QueryRow(query, institutionID, username, password).Scan(&id)
	return id, err
}

func GetAdmins() ([]Admin, error) {
	rows, err := db.Query(`SELECT id, institutionId, username, password FROM Admin`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []Admin
	for rows.Next() {
		var admin Admin
		if err := rows.Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.Password); err != nil {
			return nil, err
		}
		admins = append(admins, admin)
	}
	return admins, nil
}

func GetAdminByID(id int) (Admin, error) {
	var admin Admin
	query := `SELECT id, institutionId, username, password FROM Admin WHERE id = $1`
	err := db.QueryRow(query, id).Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.Password)
	return admin, err
}

func UpdateAdmin(id int, institutionID int, username, password string) error {
	query := `UPDATE Admin SET institutionId = $1, username = $2, password = $3 WHERE id = $4`
	_, err := db.Exec(query, institutionID, username, password, id)
	return err
}

func DeleteAdmin(id int) error {
	query := `DELETE FROM Admin WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// User Operations
func CreateUser(firstName, middleName, lastName, username, password, avatarUrl string) (int, error) {
	var id int
	query := `INSERT INTO AppUser (firstName, middleName, lastName, username, password, avatarUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err := db.QueryRow(query, firstName, middleName, lastName, username, password, avatarUrl).Scan(&id)
	return id, err
}

func GetUsers() ([]User, error) {
	rows, err := db.Query(`SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func GetUserByID(id int) (User, error) {
	var user User
	query := `SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser WHERE id = $1`
	err := db.QueryRow(query, id).Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl)
	return user, err
}

func GetUserByUsername(username string) (User, error) {
	var user User
	query := `SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser WHERE username = $1`
	err := db.QueryRow(query, username).Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl)
	return user, err
}

func UpdateUser(id int, firstName, middleName, lastName, username, password, avatarUrl string) error {
	query := `UPDATE AppUser SET firstName = $1, middleName = $2, lastName = $3, username = $4, password = $5, avatarUrl = $6 WHERE id = $7`
	_, err := db.Exec(query, firstName, middleName, lastName, username, password, avatarUrl, id)
	return err
}

func DeleteUser(id int) error {
	query := `DELETE FROM AppUser WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// Course Operations
func CreateCourse(institutionID int, name, description string) (int, error) {
	var id int
	query := `INSERT INTO Course (institutionId, name, description) VALUES ($1, $2, $3) RETURNING id`
	err := db.QueryRow(query, institutionID, name, description).Scan(&id)
	return id, err
}

func GetCourses() ([]Course, error) {
	rows, err := db.Query(`SELECT id, institutionId, name, description FROM Course`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var course Course
		if err := rows.Scan(&course.ID, &course.InstitutionID, &course.Name, &course.Description); err != nil {
			return nil, err
		}
		courses = append(courses, course)
	}
	return courses, nil
}

func GetCourseByID(id int) (Course, error) {
	var course Course
	query := `SELECT id, institutionId, name, description FROM Course WHERE id = $1`
	err := db.QueryRow(query, id).Scan(&course.ID, &course.InstitutionID, &course.Name, &course.Description)
	return course, err
}

func UpdateCourse(id int, institutionID int, name, description string) error {
	query := `UPDATE Course SET institutionId = $1, name = $2, description = $3 WHERE id = $4`
	_, err := db.Exec(query, institutionID, name, description, id)
	return err
}

func DeleteCourse(id int) error {
	query := `DELETE FROM Course WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// UserCourse Operations
func CreateUserCourse(appUserId int, courseId int, year int, semester int, role string, isComplete bool, isArchived bool) (int, int, error) {
	var returnUserId int
	var returnCourseId int
	query := `INSERT INTO AppUserCourse (appUserId, courseId, year, semester, role, isComplete, isArchived) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING appUserId, courseId`
	err := db.QueryRow(query, appUserId, courseId, year, semester, role, isComplete, isArchived).Scan(&returnUserId, &returnCourseId)
	return returnUserId, returnCourseId, err
}

func GetUserCoursesByUserID(userId int) ([]UserCourse, error) {
	query := `SELECT userId, courseId, year, semester, role, isComplete, isArchived FROM AppUserCourse WHERE appUserId = $1`
	rows, err := db.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userCourses []UserCourse
	for rows.Next() {
		var userCourse UserCourse
		if err := rows.Scan(&userCourse.UserID, &userCourse.CourseID, &userCourse.Year, &userCourse.Semester, &userCourse.Role, &userCourse.IsComplete, &userCourse.IsArchived); err != nil {
			return nil, err
		}
		userCourses = append(userCourses, userCourse)
	}
	return userCourses, nil
}

func GetUserCoursesJoinCoursesByUserID(userId int) ([]UserCourseJoinCourse, error) {
	query := `SELECT appUserId, courseId, year, semester, role, isComplete, isArchived, institutionId, courseId, name, description FROM AppUserCourse INNER JOIN Course ON AppUserCourse.courseId = Course.id WHERE appUserId = $1`
	rows, err := db.Query(query, userId)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userCourses []UserCourseJoinCourse
	for rows.Next() {
		var userCourse UserCourseJoinCourse
		if err := rows.Scan(&userCourse.UserID, &userCourse.CourseID, &userCourse.Year, &userCourse.Semester, &userCourse.Role, &userCourse.IsComplete, &userCourse.IsArchived, &userCourse.InstitutionID, &userCourse.CourseID, &userCourse.Name, &userCourse.Description); err != nil {
			fmt.Println(err)
			return nil, err
		}
		userCourses = append(userCourses, userCourse)
	}
	return userCourses, nil
}

func GetUsersInCourseByCourseID(courseId int) ([]UserCourse, error) {
	query := `SELECT appUserId, courseId, year, semester, role, isComplete, isArchived FROM AppUserCourse WHERE courseId = $1`
	rows, err := db.Query(query, courseId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userCourses []UserCourse
	for rows.Next() {
		var userCourse UserCourse
		if err := rows.Scan(&userCourse.UserID, &userCourse.CourseID, &userCourse.Year, &userCourse.Semester, &userCourse.Role, &userCourse.IsComplete, &userCourse.IsArchived); err != nil {
			return nil, err
		}
		userCourses = append(userCourses, userCourse)
	}
	return userCourses, nil
}

// type CourseThread struct {
// 	ID            int    `json:"id"`
// 	UserID        int    `json:"userId"`
// 	CourseID      int    `json:"courseId"`
// 	Content 	  string `json:"content"`
// 	CreatedAt time.Time `json:"createdAt"`
// 	ModifiedAt time.Time `json:"modifiedAt"`
// }
func CreateCourseThread(appUserId int, courseId int, title string, postType string, content string) (int, error) {
	var courseThreadID int
	query := `INSERT INTO CourseThread (appUserId, courseId, title, type, content) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := db.QueryRow(query, appUserId, courseId, title, postType, content).Scan(&courseThreadID)
	return courseThreadID, err
}

// If updating course thread, make sure to change modifiedAt

func GetCourseThreadsByCourseID(courseId int) ([]CourseThread, error) {
	query := `SELECT id, appUserId, courseId, title, type, content, createdAt, modifiedAt FROM CourseThread WHERE courseId = $1 ORDER BY createdAt DESC`
	rows, err := db.Query(query, courseId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courseThreads []CourseThread
	for rows.Next() {
		var courseThread CourseThread
		if err := rows.Scan(&courseThread.ID, &courseThread.UserID, &courseThread.CourseID, &courseThread.Title, &courseThread.Type, &courseThread.Content, &courseThread.CreatedAt, &courseThread.ModifiedAt); err != nil {
			fmt.Println(err)
			return nil, err
		}
		courseThreads = append(courseThreads, courseThread)
	}
	return courseThreads, nil
}

func GetCourseThreadByID(id int) (CourseThread, error) {
	var courseThread CourseThread
	query := `SELECT id, appUserId, courseId, title, type, content, createdAt, modifiedAt FROM CourseThread WHERE id = $1`
	err := db.QueryRow(query, id).Scan(&courseThread.ID, &courseThread.UserID, &courseThread.CourseID, &courseThread.Title, &courseThread.Type, &courseThread.Content, &courseThread.CreatedAt, &courseThread.ModifiedAt)
	return courseThread, err
}