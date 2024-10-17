package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // PostgreSQL driver
)

type Institution struct {
    ID        int    `json:"id"`
    Name      string `json:"name"`
    Continent string `json:"continent"`
}

type AppAdmin struct {
    ID            int    `json:"id"`
    InstitutionID int    `json:"institution_id"`
    Username      string `json:"username"`
    PasswordHash  string `json:"password_hash"`
}

type AppUser struct {
    ID           int    `json:"id"`
    FirstName    string `json:"first_name"`
    MiddleName   string `json:"middle_name"`
    LastName     string `json:"last_name"`
    Username     string `json:"username"`
    PasswordHash string `json:"password_hash"`
    AvatarUrl    string `json:"avatar_url"`
}

type Course struct {
    ID            int    `json:"id"`
    InstitutionID int    `json:"institution_id"`
    Name          string `json:"name"`
    Description   string `json:"description"`
}

var db *sql.DB

func InitialiseDB() {
    var err error
	db, err = sql.Open("postgres", "postgresql://postgres:password@localhost:5432/edstomp?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

    // Test the database connection
    if err = db.Ping(); err != nil {
        log.Fatal(err)
    }
	
    fmt.Println("Connected to the database successfully!")
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
func CreateAdmin(institutionID int, username, passwordHash string) (int, error) {
    var id int
    query := `INSERT INTO Admin (institutionId, username, passwordHash) VALUES ($1, $2, $3) RETURNING id`
    err := db.QueryRow(query, institutionID, username, passwordHash).Scan(&id)
    return id, err
}

func GetAdmins() ([]AppAdmin, error) {
    rows, err := db.Query(`SELECT id, institutionId, username, passwordHash FROM Admin`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var admins []AppAdmin
    for rows.Next() {
        var admin AppAdmin
        if err := rows.Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.PasswordHash); err != nil {
            return nil, err
        }
        admins = append(admins, admin)
    }
    return admins, nil
}

func GetAdminByID(id int) (AppAdmin, error) {
    var admin AppAdmin
    query := `SELECT id, institutionId, username, passwordHash FROM Admin WHERE id = $1`
    err := db.QueryRow(query, id).Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.PasswordHash)
    return admin, err
}

func UpdateAdmin(id int, institutionID int, username, passwordHash string) error {
    query := `UPDATE Admin SET institutionId = $1, username = $2, passwordHash = $3 WHERE id = $4`
    _, err := db.Exec(query, institutionID, username, passwordHash, id)
    return err
}

func DeleteAdmin(id int) error {
    query := `DELETE FROM Admin WHERE id = $1`
    _, err := db.Exec(query, id)
    return err
}

// AppUser Operations
func CreateAppUser(firstName, middleName, lastName, username, passwordHash, avatarUrl string) (int, error) {
    var id int
    query := `INSERT INTO AppUser (firstName, middleName, lastName, username, passwordHash, avatarUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
    err := db.QueryRow(query, firstName, middleName, lastName, username, passwordHash, avatarUrl).Scan(&id)
    return id, err
}

func GetAppUsers() ([]AppUser, error) {
    rows, err := db.Query(`SELECT id, firstName, middleName, lastName, username, passwordHash, avatarUrl FROM AppUser`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var appUsers []AppUser
    for rows.Next() {
        var appUser AppUser
        if err := rows.Scan(&appUser.ID, &appUser.FirstName, &appUser.MiddleName, &appUser.LastName, &appUser.Username, &appUser.PasswordHash, &appUser.AvatarUrl); err != nil {
            return nil, err
        }
        appUsers = append(appUsers, appUser)
    }
    return appUsers, nil
}

func GetAppUserByID(id int) (AppUser, error) {
    var appUser AppUser
    query := `SELECT id, firstName, middleName, lastName, username, passwordHash, avatarUrl FROM AppUser WHERE id = $1`
    err := db.QueryRow(query, id).Scan(&appUser.ID, &appUser.FirstName, &appUser.MiddleName, &appUser.LastName, &appUser.Username, &appUser.PasswordHash, &appUser.AvatarUrl)
    return appUser, err
}

func UpdateAppUser(id int, firstName, middleName, lastName, username, passwordHash, avatarUrl string) error {
    query := `UPDATE AppUser SET firstName = $1, middleName = $2, lastName = $3, username = $4, passwordHash = $5, avatarUrl = $6 WHERE id = $7`
    _, err := db.Exec(query, firstName, middleName, lastName, username, passwordHash, avatarUrl, id)
    return err
}

func DeleteAppUser(id int) error {
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
