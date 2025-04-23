package service

import (
	"database/sql"
	"fmt"

	"github.com/lachlanmacphee/eddy/database"

	_ "github.com/mattn/go-sqlite3"
)

// Institution Operations
func CreateInstitution(name, continent string) (int, error) {
	var id int
	query := `INSERT INTO Institution (name, continent) VALUES ($1, $2) RETURNING id`
	err := database.DB.QueryRow(query, name, continent).Scan(&id)
	return id, err
}

func GetInstitutions() ([]database.Institution, error) {
	rows, err := database.DB.Query(`SELECT id, name, continent FROM Institution`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var institutions []database.Institution
	for rows.Next() {
		var institution database.Institution
		if err := rows.Scan(&institution.ID, &institution.Name, &institution.Continent); err != nil {
			return nil, err
		}
		institutions = append(institutions, institution)
	}
	return institutions, nil
}

func GetInstitutionByID(id int) (database.Institution, error) {
	var institution database.Institution
	query := `SELECT id, name, continent FROM Institution WHERE id = $1`
	err := database.DB.QueryRow(query, id).Scan(&institution.ID, &institution.Name, &institution.Continent)
	return institution, err
}

func UpdateInstitution(id int, name, continent string) error {
	query := `UPDATE Institution SET name = $1, continent = $2 WHERE id = $3`
	_, err := database.DB.Exec(query, name, continent, id)
	return err
}

func DeleteInstitution(id int) error {
	query := `DELETE FROM Institution WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	return err
}

// Admin Operations
func CreateAdmin(institutionID int, username, password string) (int, error) {
	var id int
	query := `INSERT INTO Admin (institutionId, username, password) VALUES ($1, $2, $3) RETURNING id`
	err := database.DB.QueryRow(query, institutionID, username, password).Scan(&id)
	return id, err
}

func GetAdmins() ([]database.Admin, error) {
	rows, err := database.DB.Query(`SELECT id, institutionId, username, password FROM Admin`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []database.Admin
	for rows.Next() {
		var admin database.Admin
		if err := rows.Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.Password); err != nil {
			return nil, err
		}
		admins = append(admins, admin)
	}
	return admins, nil
}

func GetAdminByID(id int) (database.Admin, error) {
	var admin database.Admin
	query := `SELECT id, institutionId, username, password FROM Admin WHERE id = $1`
	err := database.DB.QueryRow(query, id).Scan(&admin.ID, &admin.InstitutionID, &admin.Username, &admin.Password)
	return admin, err
}

func UpdateAdmin(id int, institutionID int, username, password string) error {
	query := `UPDATE Admin SET institutionId = $1, username = $2, password = $3 WHERE id = $4`
	_, err := database.DB.Exec(query, institutionID, username, password, id)
	return err
}

func DeleteAdmin(id int) error {
	query := `DELETE FROM Admin WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	return err
}

// User Operations
func CreateUser(firstName, middleName, lastName, username, password, avatarUrl string) (int, error) {
	var id int
	query := `INSERT INTO AppUser (firstName, middleName, lastName, username, password, avatarUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err := database.DB.QueryRow(query, firstName, middleName, lastName, username, password, avatarUrl).Scan(&id)
	return id, err
}

func GetUsers() ([]database.User, error) {
	rows, err := database.DB.Query(`SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []database.User
	for rows.Next() {
		var user database.User
		if err := rows.Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func GetUserByID(id int) (database.User, error) {
	var user database.User
	query := `SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser WHERE id = $1`
	err := database.DB.QueryRow(query, id).Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl)
	return user, err
}

func GetUserByUsername(username string) (database.User, error) {
	var user database.User
	query := `SELECT id, firstName, middleName, lastName, username, password, avatarUrl FROM AppUser WHERE username = $1`
	err := database.DB.QueryRow(query, username).Scan(&user.ID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Username, &user.Password, &user.AvatarUrl)
	return user, err
}

func UpdateUser(id int, firstName, middleName, lastName, username, password, avatarUrl string) error {
	query := `UPDATE AppUser SET firstName = $1, middleName = $2, lastName = $3, username = $4, password = $5, avatarUrl = $6 WHERE id = $7`
	_, err := database.DB.Exec(query, firstName, middleName, lastName, username, password, avatarUrl, id)
	return err
}

func DeleteUser(id int) error {
	query := `DELETE FROM AppUser WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	return err
}

// Course Operations
func CreateCourse(institutionID int, name, description string) (int, error) {
	var id int
	query := `INSERT INTO Course (institutionId, name, description) VALUES ($1, $2, $3) RETURNING id`
	err := database.DB.QueryRow(query, institutionID, name, description).Scan(&id)
	return id, err
}

func GetCourses() ([]database.Course, error) {
	rows, err := database.DB.Query(`SELECT id, institutionId, name, description FROM Course`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []database.Course
	for rows.Next() {
		var course database.Course
		if err := rows.Scan(&course.ID, &course.InstitutionID, &course.Name, &course.Description); err != nil {
			return nil, err
		}
		courses = append(courses, course)
	}
	return courses, nil
}

func GetCourseByID(id int) (database.Course, error) {
	var course database.Course
	query := `SELECT id, institutionId, name, description FROM Course WHERE id = $1`
	err := database.DB.QueryRow(query, id).Scan(&course.ID, &course.InstitutionID, &course.Name, &course.Description)
	return course, err
}

func UpdateCourse(id int, institutionID int, name, description string) error {
	query := `UPDATE Course SET institutionId = $1, name = $2, description = $3 WHERE id = $4`
	_, err := database.DB.Exec(query, institutionID, name, description, id)
	return err
}

func DeleteCourse(id int) error {
	query := `DELETE FROM Course WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	return err
}

// UserCourse Operations
func CreateUserCourse(appUserId int, courseId int, year int, semester int, role string, isComplete bool, isArchived bool) (int, int, error) {
	var returnUserId int
	var returnCourseId int
	query := `INSERT INTO AppUserCourse (appUserId, courseId, year, semester, role, isComplete, isArchived) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING appUserId, courseId`
	err := database.DB.QueryRow(query, appUserId, courseId, year, semester, role, isComplete, isArchived).Scan(&returnUserId, &returnCourseId)
	return returnUserId, returnCourseId, err
}

func GetUserCoursesByUserID(userId int) ([]database.UserCourse, error) {
	query := `SELECT userId, courseId, year, semester, role, isComplete, isArchived FROM AppUserCourse WHERE appUserId = $1`
	rows, err := database.DB.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userCourses []database.UserCourse
	for rows.Next() {
		var userCourse database.UserCourse
		if err := rows.Scan(&userCourse.UserID, &userCourse.CourseID, &userCourse.Year, &userCourse.Semester, &userCourse.Role, &userCourse.IsComplete, &userCourse.IsArchived); err != nil {
			return nil, err
		}
		userCourses = append(userCourses, userCourse)
	}
	return userCourses, nil
}

func GetUserCoursesJoinCoursesByUserID(userId int) ([]database.UserCourseJoinCourse, error) {
	query := `SELECT appUserId, courseId, year, semester, role, isComplete, isArchived, institutionId, courseId, name, description FROM AppUserCourse INNER JOIN Course ON AppUserCourse.courseId = Course.id WHERE appUserId = $1`
	rows, err := database.DB.Query(query, userId)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var detailedCourses []database.UserCourseJoinCourse
	for rows.Next() {
		var userCourse database.UserCourseJoinCourse
		if err := rows.Scan(&userCourse.UserCourse.UserID, &userCourse.UserCourse.CourseID, &userCourse.UserCourse.Year, &userCourse.UserCourse.Semester, &userCourse.UserCourse.Role, &userCourse.UserCourse.IsComplete, &userCourse.UserCourse.IsArchived, &userCourse.Course.InstitutionID, &userCourse.Course.ID, &userCourse.Course.Name, &userCourse.Course.Description); err != nil {
			fmt.Println(err)
			return nil, err
		}
		detailedCourses = append(detailedCourses, userCourse)
	}
	return detailedCourses, nil
}

func GetUsersInCourseByCourseID(courseId int) ([]database.UserCourse, error) {
	query := `SELECT appUserId, courseId, year, semester, role, isComplete, isArchived FROM AppUserCourse WHERE courseId = $1`
	rows, err := database.DB.Query(query, courseId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userCourses []database.UserCourse
	for rows.Next() {
		var userCourse database.UserCourse
		if err := rows.Scan(&userCourse.UserID, &userCourse.CourseID, &userCourse.Year, &userCourse.Semester, &userCourse.Role, &userCourse.IsComplete, &userCourse.IsArchived); err != nil {
			return nil, err
		}
		userCourses = append(userCourses, userCourse)
	}
	return userCourses, nil
}

func CreateCourseThread(appUserId int, courseId int, title string, postType string, content string) (int, error) {
	var courseThreadID int
	query := `INSERT INTO CourseThread (appUserId, courseId, title, type, content) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := database.DB.QueryRow(query, appUserId, courseId, title, postType, content).Scan(&courseThreadID)
	return courseThreadID, err
}

func GetCourseThreadsByCourseID(courseId int) ([]database.CourseThread, error) {
	query := `SELECT id, appUserId, courseId, title, type, createdAt, modifiedAt FROM CourseThread WHERE courseId = $1 ORDER BY createdAt DESC`
	rows, err := database.DB.Query(query, courseId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courseThreads []database.CourseThread
	for rows.Next() {
		var courseThread database.CourseThread
		if err := rows.Scan(&courseThread.ID, &courseThread.UserID, &courseThread.CourseID, &courseThread.Title, &courseThread.Type, &courseThread.CreatedAt, &courseThread.ModifiedAt); err != nil {
			fmt.Println(err)
			return nil, err
		}
		courseThreads = append(courseThreads, courseThread)
	}
	return courseThreads, nil
}

func GetCourseThreadByID(id int) (database.CourseThread, error) {
	var courseThread database.CourseThread
	query := `SELECT id, appUserId, courseId, title, type, content, createdAt, modifiedAt FROM CourseThread WHERE id = $1`
	err := database.DB.QueryRow(query, id).Scan(&courseThread.ID, &courseThread.UserID, &courseThread.CourseID, &courseThread.Title, &courseThread.Type, &courseThread.Content, &courseThread.CreatedAt, &courseThread.ModifiedAt)
	return courseThread, err
}

// If updating course thread, make sure to change modifiedAt

func GetCourseThreadResponsesByThreadID(threadId int) ([]database.CourseThreadResponse, error) {
	query := `SELECT id, appUserId, courseThreadId, type, content, createdAt, modifiedAt FROM CourseThreadResponse WHERE courseThreadId = $1`
	rows, err := database.DB.Query(query, threadId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var responses []database.CourseThreadResponse
	for rows.Next() {
		var response database.CourseThreadResponse
		if err := rows.Scan(&response.ID, &response.UserID, &response.CourseThreadID, &response.Type, &response.Content, &response.CreatedAt, &response.ModifiedAt); err != nil {
			fmt.Println(err)
			return nil, err
		}
		responses = append(responses, response)
	}
	return responses, nil
}

func CreateCourseThreadResponse(appUserId int, threadID int, postType string, content string) (int, error) {
	var courseThreadResponseID int
	query := `INSERT INTO CourseThreadResponse (appUserId, courseId, type, content) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := database.DB.QueryRow(query, appUserId, threadID, postType, content).Scan(&courseThreadResponseID)
	return courseThreadResponseID, err
}

func GetCourseLessonsByCourseID(courseId int) ([]database.CourseLesson, error) {
	query := `SELECT id, courseId, courseWeek, title, description, createdAt, modifiedAt FROM CourseLesson WHERE courseId = $1 ORDER BY courseWeek ASC`
	rows, err := database.DB.Query(query, courseId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courseLessons []database.CourseLesson
	for rows.Next() {
		var courseLesson database.CourseLesson
		if err := rows.Scan(&courseLesson.ID, &courseLesson.CourseID, &courseLesson.CourseWeek, &courseLesson.Title, &courseLesson.Description, &courseLesson.CreatedAt, &courseLesson.ModifiedAt); err != nil {
			fmt.Println(err)
			return nil, err
		}
		courseLessons = append(courseLessons, courseLesson)
	}
	return courseLessons, nil
}

func GetCourseLessonSectionsWithBlocksByLessonID(lessonId int) ([]database.CourseLessonSectionJoinBlocks, error) {
	query := `SELECT 
		CourseLessonSection.id, 
		CourseLessonSection.courseLessonId, 
		CourseLessonSection.title, 
		CourseLessonSectionBlock.id, 
		CourseLessonSectionBlock.title, 
		CourseLessonSectionBlock.description, 
		CourseLessonSectionBlock.type 
	FROM 
		CourseLessonSection 
	LEFT JOIN 
		CourseLessonSectionBlock 
	ON 
		CourseLessonSection.id = CourseLessonSectionBlock.courseLessonSectionId 
	WHERE 
		courseLessonId = $1`
	
	rows, err := database.DB.Query(query, lessonId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Map to hold sections and avoid duplicates
	sectionMap := make(map[int]*database.CourseLessonSectionJoinBlocks)

	for rows.Next() {
		var sectionID, blockID sql.NullInt64
		var courseLessonID int
		var sectionTitle, blockTitle, blockDescription, blockType sql.NullString

		err := rows.Scan(&sectionID, &courseLessonID, &sectionTitle, &blockID, &blockTitle, &blockDescription, &blockType)
		if err != nil {
			return nil, err
		}

		// Check if the section already exists in the map
		section, exists := sectionMap[int(sectionID.Int64)]
		if !exists {
			// Create a new section
			section = &database.CourseLessonSectionJoinBlocks{
				CourseLessonSection: database.CourseLessonSection{
					ID:            int(sectionID.Int64),
					CourseLessonID: courseLessonID,
					Title:         sectionTitle.String,
				},
				Blocks:        []database.CourseLessonSectionBlock{},
			}
			sectionMap[int(sectionID.Int64)] = section
		}

		// Only add a block if it exists (blockID is not NULL)
		if blockID.Valid {
			block := database.CourseLessonSectionBlock{
				ID:          int(blockID.Int64),
				Title:       blockTitle.String,
				Description: blockDescription.String,
				Type:        blockType.String,
			}
			section.Blocks = append(section.Blocks, block)
		}
	}

	// Convert the map values to a slice
	var courseLessonSectionsWithBlocks []database.CourseLessonSectionJoinBlocks
	for _, section := range sectionMap {
		courseLessonSectionsWithBlocks = append(courseLessonSectionsWithBlocks, *section)
	}

	return courseLessonSectionsWithBlocks, nil
}