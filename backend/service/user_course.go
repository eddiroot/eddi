package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

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

// CreateUserCourse creates a new user-course relationship
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
	
	stmt := table.UserCourse.INSERT(table.UserCourse.MutableColumns).
		MODEL(insrt).
		RETURNING(table.UserCourse.AllColumns)

	userCourse := model.UserCourse{}
	err := stmt.Query(database.DB, &userCourse)

	return userCourse, err
}

// GetUserCoursesByUserID retrieves all course relationships for a specific user
func GetUserCoursesByUserID(userId int) ([]model.UserCourse, error) {
	stmt := postgres.SELECT(
		table.UserCourse.AllColumns,
	).FROM(
		table.UserCourse,
	).WHERE(
		table.UserCourse.UserId.EQ(postgres.Int32(int32(userId))),
	)

	userCourses := []model.UserCourse{}
	err := stmt.Query(database.DB, &userCourses)
	
	return userCourses, err
}

// GetUsersInCourseByCourseID retrieves all user relationships for a specific course
func GetUsersInCourseByCourseID(courseId int) ([]model.UserCourse, error) {
	stmt := postgres.SELECT(
		table.UserCourse.AllColumns,
	).FROM(
		table.UserCourse,
	).WHERE(
		table.UserCourse.CourseId.EQ(postgres.Int32(int32(courseId))),
	)

	userCourses := []model.UserCourse{}
	err := stmt.Query(database.DB, &userCourses)
	
	return userCourses, err
}

// GetUserCoursesJoinCoursesByUserID retrieves all courses with details for a user
func GetUserCoursesJoinCoursesByUserID(userId int) ([]UserCourseJoinCourse, error) {
	stmt := postgres.SELECT(
		table.UserCourse.UserId,
		table.UserCourse.CourseId,
		table.UserCourse.Year,
		table.UserCourse.Semester,
		table.UserCourse.Role,
		table.UserCourse.IsComplete,
		table.UserCourse.IsArchived,
		table.Course.InstitutionId,
		table.Course.ID,
		table.Course.Name,
		table.Course.Description,
	).FROM(
		table.UserCourse.
			INNER_JOIN(table.Course, table.UserCourse.CourseId.EQ(table.Course.ID)),
	).WHERE(
		table.UserCourse.UserId.EQ(postgres.Int32(int32(userId))),
	)

	var results []struct {
		UserId      int32   `sql:"userId"`
		CourseId    int32   `sql:"courseId"`
		Year        int32
		Semester    int32
		Role        *string
		IsComplete  *bool
		IsArchived  *bool
		InstId      int32   `sql:"institutionId"`
		CourseID    int32   `sql:"id"`
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