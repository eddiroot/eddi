package service

import (
	"database/sql"

	. "github.com/go-jet/jet/v2/postgres"
	. "github.com/lachlanmacphee/eddy/.gen/eddy/public/table"

	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"

	"github.com/lachlanmacphee/eddy/database"
)

// Institution Operations
func CreateInstitution(name string, continent string) (model.Institution, error) {
	insrt := model.Institution{
		Name:      name,
		Continent: &continent,
	}
	
	stmt := Institution.INSERT(Institution.MutableColumns).MODEL(insrt).RETURNING(Institution.AllColumns)

	institution := model.Institution{}
	err := stmt.Query(database.DB, &institution)

	return institution, err
}

func GetInstitutions() ([]model.Institution, error) {
	stmt := SELECT(
		Institution.ID, Institution.Name, Institution.Continent,
	).FROM(
		Institution,
	)

	institutions := []model.Institution{}
	err := stmt.Query(database.DB, &institutions)
	if err != nil {
		return nil, err
	}

	return institutions, nil
}

func GetInstitutionByID(id int) (model.Institution, error) {
	stmt := SELECT(
		Institution.AllColumns,
	).FROM(
		Institution,
	).WHERE(
		Institution.ID.EQ(Int32(int32(id))),
	)

	institution := model.Institution{}
	err := stmt.Query(database.DB, &institution)

	return institution, err
}

func UpdateInstitution(id int, name, continent string) (model.Institution, error) {
	stmt := Institution.UPDATE().
		SET(
			Institution.Name.SET(String(name)),
			Institution.Continent.SET(String(continent)),
		).WHERE(
			Institution.ID.EQ(Int32(int32(id))),
		)

	// Execute the update
	_, err := stmt.Exec(database.DB)
	if err != nil {
		return model.Institution{}, err
	}
	
	// Fetch the updated object
	return GetInstitutionByID(id)
}

func DeleteInstitution(id int) error {
	stmt := Institution.DELETE().WHERE(
		Institution.ID.EQ(Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}

// Admin Operations
func CreateAdmin(institutionID int, username, password string) (model.Admin, error) {
	insrt := model.Admin{
			InstitutionId: int32(institutionID),
			Username:      username,
			Password:      password,
	}
	
	stmt := Admin.INSERT(Admin.MutableColumns).MODEL(insrt).RETURNING(Admin.AllColumns)

	admin := model.Admin{}
	err := stmt.Query(database.DB, &admin)

	return admin, err
}

func GetAdmins() ([]model.Admin, error) {
	stmt := SELECT(
		Admin.AllColumns,
	).FROM(
		Admin,
	)

	admins := []model.Admin{}
	err := stmt.Query(database.DB, &admins)
	
	return admins, err
}

func GetAdminByID(id int) (model.Admin, error) {
	stmt := SELECT(
		Admin.AllColumns,
	).FROM(
		Admin,
	).WHERE(
		Admin.ID.EQ(Int32(int32(id))),
	)

	admin := model.Admin{}
	err := stmt.Query(database.DB, &admin)
	
	return admin, err
}

func UpdateAdmin(id int, institutionID int, username, password string) (model.Admin, error) {
	stmt := Admin.UPDATE().
		SET(
			Admin.InstitutionId.SET(Int32(int32(institutionID))),
			Admin.Username.SET(String(username)),
			Admin.Password.SET(String(password)),
		).WHERE(
			Admin.ID.EQ(Int32(int32(id))),
		)

	// Execute the update
	_, err := stmt.Exec(database.DB)
	if err != nil {
		return model.Admin{}, err
	}
	
	// Fetch the updated object
	return GetAdminByID(id)
}

func DeleteAdmin(id int) error {
	stmt := Admin.DELETE().WHERE(
		Admin.ID.EQ(Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}

// User Operations
func CreateUser(firstName, middleName, lastName, username, password, avatarUrl string) (model.User, error) {
	insrt := model.User{
		FirstName:  firstName,
		MiddleName: &middleName,
		LastName:   lastName,
		Username:   username,
		Password:   password,
		AvatarUrl:  &avatarUrl,
	}
	
	stmt := User.INSERT(User.MutableColumns).MODEL(insrt).RETURNING(User.AllColumns)

	user := model.User{}
	err := stmt.Query(database.DB, &user)

	return user, err
}

func GetUsers() ([]model.User, error) {
	stmt := SELECT(
		User.AllColumns,
	).FROM(
		User,
	)

	users := []model.User{}
	err := stmt.Query(database.DB, &users)
	
	return users, err
}

func GetUserByID(id int) (model.User, error) {
	stmt := SELECT(
		User.AllColumns,
	).FROM(
		User,
	).WHERE(
		User.ID.EQ(Int32(int32(id))),
	)

	user := model.User{}
	err := stmt.Query(database.DB, &user)
	
	return user, err
}

func GetUserByUsername(username string) (model.User, error) {
	stmt := SELECT(
		User.AllColumns,
	).FROM(
		User,
	).WHERE(
		User.Username.EQ(String(username)),
	)

	user := model.User{}
	err := stmt.Query(database.DB, &user)
	
	return user, err
}

func UpdateUser(id int, firstName, middleName, lastName, username, password, avatarUrl string) (model.User, error) {
	stmt := User.UPDATE().
		SET(
			User.FirstName.SET(String(firstName)),
			User.MiddleName.SET(String(middleName)),
			User.LastName.SET(String(lastName)),
			User.Username.SET(String(username)),
			User.Password.SET(String(password)),
			User.AvatarUrl.SET(String(avatarUrl)),
		).WHERE(
			User.ID.EQ(Int32(int32(id))),
		)

	// Execute the update
	_, err := stmt.Exec(database.DB)
	if err != nil {
		return model.User{}, err
	}
	
	// Fetch the updated object
	return GetUserByID(id)
}

func DeleteUser(id int) error {
	stmt := User.DELETE().WHERE(
		User.ID.EQ(Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}

// Course Operations
func CreateCourse(institutionID int, name, description string) (model.Course, error) {
	insrt := model.Course{
			InstitutionId: int32(institutionID),
			Name:          name,
			Description:   description,
	}
	
	stmt := Course.INSERT(Course.MutableColumns).MODEL(insrt).RETURNING(Course.AllColumns)

	course := model.Course{}
	err := stmt.Query(database.DB, &course)

	return course, err
}

func GetCourses() ([]model.Course, error) {
	stmt := SELECT(
		Course.AllColumns,
	).FROM(
		Course,
	)

	courses := []model.Course{}
	err := stmt.Query(database.DB, &courses)
	
	return courses, err
}

func GetCourseByID(id int) (model.Course, error) {
	stmt := SELECT(
		Course.AllColumns,
	).FROM(
		Course,
	).WHERE(
		Course.ID.EQ(Int32(int32(id))),
	)

	course := model.Course{}
	err := stmt.Query(database.DB, &course)
	
	return course, err
}

func UpdateCourse(id int, institutionID int, name, description string) (model.Course, error) {
	stmt := Course.UPDATE().
		SET(
			Course.InstitutionId.SET(Int32(int32(institutionID))),
			Course.Name.SET(String(name)),
			Course.Description.SET(String(description)),
		).WHERE(
			Course.ID.EQ(Int32(int32(id))),
		)

	// Execute the update
	_, err := stmt.Exec(database.DB)
	if err != nil {
		return model.Course{}, err
	}
	
	// Fetch the updated object
	return GetCourseByID(id)
}

func DeleteCourse(id int) error {
	stmt := Course.DELETE().WHERE(
		Course.ID.EQ(Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}

// UserCourse Operations
func CreateUserCourse(appUserId int, courseId int, year int, semester int, role string, isComplete bool, isArchived bool) (model.UserCourse, error) {
	insrt := model.UserCourse{
		UserId:     int32(appUserId),
		CourseId:   int32(courseId),
		Year:       int32(year),
		Semester:   int32(semester),
		Role:       &role,
		IsComplete: &isComplete,
		IsArchived: &isArchived,
	}
	
	stmt := UserCourse.INSERT(UserCourse.MutableColumns).MODEL(insrt).RETURNING(UserCourse.AllColumns)

	userCourse := model.UserCourse{}
	err := stmt.Query(database.DB, &userCourse)

	return userCourse, err
}

func GetUserCoursesByUserID(userId int) ([]model.UserCourse, error) {
	stmt := SELECT(
		UserCourse.AllColumns,
	).FROM(
		UserCourse,
	).WHERE(
		UserCourse.UserId.EQ(Int32(int32(userId))),
	)

	userCourses := []model.UserCourse{}
	err := stmt.Query(database.DB, &userCourses)
	
	return userCourses, err
}

func GetUsersInCourseByCourseID(courseId int) ([]model.UserCourse, error) {
	stmt := SELECT(
		UserCourse.AllColumns,
	).FROM(
		UserCourse,
	).WHERE(
		UserCourse.CourseId.EQ(Int32(int32(courseId))),
	)

	userCourses := []model.UserCourse{}
	err := stmt.Query(database.DB, &userCourses)
	
	return userCourses, err
}

// UserCourseJoinCourse is a structure to hold joined UserCourse and Course data
type UserCourseJoinCourse struct {
	UserCourse struct {
		UserID     int
		CourseID   int
		Year       int
		Semester   int
		Role       string
		IsComplete bool
		IsArchived bool
	}
	Course struct {
		ID            int
		InstitutionID int
		Name          string
		Description   string
	}
}

func GetUserCoursesJoinCoursesByUserID(userId int) ([]UserCourseJoinCourse, error) {
	stmt := SELECT(
		UserCourse.UserId,
		UserCourse.CourseId,
		UserCourse.Year,
		UserCourse.Semester,
		UserCourse.Role,
		UserCourse.IsComplete,
		UserCourse.IsArchived,
		Course.InstitutionId,
		Course.ID,
		Course.Name,
		Course.Description,
	).FROM(
		UserCourse.
			INNER_JOIN(Course, UserCourse.CourseId.EQ(Course.ID)),
	).WHERE(
		UserCourse.UserId.EQ(Int32(int32(userId))),
	)

	var results []struct {
		UserId      int32          `sql:"userId"`
		CourseId    int32          `sql:"courseId"`
		Year        int32
		Semester    int32
		Role        *string
		IsComplete  *bool
		IsArchived  *bool
		InstId      int32          `sql:"institutionId"`
		CourseID    int32          `sql:"id"`
		Name        string
		Description string
	}

	err := stmt.Query(database.DB, &results)
	if err != nil {
		return nil, err
	}

	var detailedCourses []UserCourseJoinCourse
	for _, r := range results {
		// Handle possible nil values
		var role string
		var isComplete, isArchived bool
		
		if r.Role != nil {
			role = *r.Role
		}
		if r.IsComplete != nil {
			isComplete = *r.IsComplete
		}
		if r.IsArchived != nil {
			isArchived = *r.IsArchived
		}
		
		userCourse := UserCourseJoinCourse{}
		userCourse.UserCourse.UserID = int(r.UserId)
		userCourse.UserCourse.CourseID = int(r.CourseId)
		userCourse.UserCourse.Year = int(r.Year)
		userCourse.UserCourse.Semester = int(r.Semester) 
		userCourse.UserCourse.Role = role
		userCourse.UserCourse.IsComplete = isComplete
		userCourse.UserCourse.IsArchived = isArchived
		
		userCourse.Course.ID = int(r.CourseID)
		userCourse.Course.InstitutionID = int(r.InstId)
		userCourse.Course.Name = r.Name
		userCourse.Course.Description = r.Description
		
		detailedCourses = append(detailedCourses, userCourse)
	}

	return detailedCourses, nil
}

func CreateCourseThread(appUserId int, courseId int, title string, content string) (model.CourseThread, error) {
	insrt := model.CourseThread{
		UserId:   int32(appUserId),
		CourseId: int32(courseId),
		Title:    title,
		Content:  content,
		// CreatedAt and ModifiedAt will be set by database defaults
	}
	
	stmt := CourseThread.INSERT(CourseThread.MutableColumns).MODEL(insrt).RETURNING(CourseThread.AllColumns)

	courseThread := model.CourseThread{}
	err := stmt.Query(database.DB, &courseThread)

	return courseThread, err
}

func GetCourseThreadsByCourseID(courseId int) ([]model.CourseThread, error) {
	stmt := SELECT(
		CourseThread.ID, 
		CourseThread.UserId,
		CourseThread.CourseId,
		CourseThread.Title,
		CourseThread.CreatedAt,
		CourseThread.ModifiedAt,
	).FROM(
		CourseThread,
	).WHERE(
		CourseThread.CourseId.EQ(Int32(int32(courseId))),
	).ORDER_BY(
		CourseThread.CreatedAt.DESC(),
	)

	courseThreads := []model.CourseThread{}
	err := stmt.Query(database.DB, &courseThreads)
	
	return courseThreads, err
}

func GetCourseThreadByID(id int) (model.CourseThread, error) {
	stmt := SELECT(
		CourseThread.AllColumns,
	).FROM(
		CourseThread,
	).WHERE(
		CourseThread.ID.EQ(Int32(int32(id))),
	)

	courseThread := model.CourseThread{}
	err := stmt.Query(database.DB, &courseThread)
	
	return courseThread, err
}

func GetCourseThreadResponsesByThreadID(threadId int) ([]model.CourseThreadResponse, error) {
	stmt := SELECT(
		CourseThreadResponse.AllColumns,
	).FROM(
		CourseThreadResponse,
	).WHERE(
		CourseThreadResponse.CourseThreadId.EQ(Int32(int32(threadId))),
	)

	responses := []model.CourseThreadResponse{}
	err := stmt.Query(database.DB, &responses)
	
	return responses, err
}

func CreateCourseThreadResponse(appUserId int, threadID int, content string) (model.CourseThreadResponse, error) {
	insrt := model.CourseThreadResponse{
		UserId:         int32(appUserId),
		CourseThreadId: int32(threadID),
		Content:        content,
		// CreatedAt and ModifiedAt will be set by database defaults
	}
	
	stmt := CourseThreadResponse.INSERT(CourseThreadResponse.MutableColumns).MODEL(insrt).RETURNING(CourseThreadResponse.AllColumns)

	response := model.CourseThreadResponse{}
	err := stmt.Query(database.DB, &response)

	return response, err
}

func GetCourseLessonsByCourseID(courseId int) ([]model.CourseLesson, error) {
	stmt := SELECT(
		CourseLesson.AllColumns,
	).FROM(
		CourseLesson,
	).WHERE(
		CourseLesson.CourseId.EQ(Int32(int32(courseId))),
	).ORDER_BY(
		CourseLesson.CourseWeek.ASC(),
	)

	courseLessons := []model.CourseLesson{}
	err := stmt.Query(database.DB, &courseLessons)
	
	return courseLessons, err
}

// Custom types for CourseLesson section functionality
type LessonSectionData struct {
	ID             int
	CourseLessonID int
	Title          string
}

type LessonSectionBlockData struct {
	ID          int
	Title       string
	Description string
	Type        string
}

type LessonSectionWithBlocks struct {
	Section LessonSectionData
	Blocks  []LessonSectionBlockData
}

func GetCourseLessonSectionsWithBlocksByLessonID(lessonId int) ([]LessonSectionWithBlocks, error) {
	stmt := SELECT(
		CourseLessonSection.ID,
		CourseLessonSection.CourseLessonId,
		CourseLessonSection.Title,
		CourseLessonSectionBlock.ID,
		CourseLessonSectionBlock.Title,
		CourseLessonSectionBlock.Description,
		CourseLessonSectionBlock.Type,
	).FROM(
		CourseLessonSection.
			LEFT_JOIN(CourseLessonSectionBlock, 
				CourseLessonSection.ID.EQ(CourseLessonSectionBlock.CourseLessonSectionId)),
	).WHERE(
		CourseLessonSection.CourseLessonId.EQ(Int32(int32(lessonId))),
	)

	var results []struct {
		SectionID      sql.NullInt64  `sql:"id"`
		CourseLessonId int32          `sql:"courseLessonId"`
		SectionTitle   sql.NullString `sql:"title"`
		BlockID        sql.NullInt64  `sql:"id_1"` // Second 'id' column gets aliased to id_1
		BlockTitle     sql.NullString `sql:"title_1"` // Second 'title' column gets aliased to title_1
		BlockDesc      sql.NullString `sql:"description"`
		BlockType      sql.NullString `sql:"type"`
	}

	err := stmt.Query(database.DB, &results)
	if err != nil {
		return nil, err
	}

	// Map to hold sections and avoid duplicates
	sectionMap := make(map[int]*LessonSectionWithBlocks)

	for _, r := range results {
		if !r.SectionID.Valid {
			continue
		}
		
		sectionID := int(r.SectionID.Int64)
		
		// Check if the section already exists in the map
		section, exists := sectionMap[sectionID]
		if !exists {
			// Create a new section
			section = &LessonSectionWithBlocks{
				Section: LessonSectionData{
					ID:             sectionID,
					CourseLessonID: int(r.CourseLessonId),
					Title:          r.SectionTitle.String,
				},
				Blocks: []LessonSectionBlockData{},
			}
			sectionMap[sectionID] = section
		}

		// Only add a block if it exists (blockID is not NULL)
		if r.BlockID.Valid {
			block := LessonSectionBlockData{
				ID:          int(r.BlockID.Int64),
				Title:       r.BlockTitle.String,
				Description: r.BlockDesc.String,
				Type:        r.BlockType.String,
			}
			section.Blocks = append(section.Blocks, block)
		}
	}

	// Convert the map values to a slice
	var lessonSectionsWithBlocks []LessonSectionWithBlocks
	for _, section := range sectionMap {
		lessonSectionsWithBlocks = append(lessonSectionsWithBlocks, *section)
	}

	return lessonSectionsWithBlocks, nil
}
