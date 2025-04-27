package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

type UserCourseWithCourse struct {
	model.UserCourse
	model.Course
}

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

func GetUserCoursesJoinCoursesByUserID(userId int) ([]UserCourseWithCourse, error) {
	stmt := postgres.SELECT(
		table.UserCourse.AllColumns,
		table.Course.AllColumns,
	).FROM(
		table.UserCourse.
			INNER_JOIN(table.Course, table.UserCourse.CourseId.EQ(table.Course.ID)),
	).WHERE(
		table.UserCourse.UserId.EQ(postgres.Int32(int32(userId))),
	)

	userCoursesWithCourses := []UserCourseWithCourse{}
	err := stmt.Query(database.DB, &userCoursesWithCourses)
	
	return userCoursesWithCourses, err
}