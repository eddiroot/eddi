package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

// CreateCourseThread creates a new discussion thread for a course
func CreateCourseThread(appUserId int, courseId int, title string, content string) (model.CourseThread, error) {
	insrt := model.CourseThread{
		UserId:   int32(appUserId),
		CourseId: int32(courseId),
		Title:    title,
		Content:  content,
		// CreatedAt and ModifiedAt will be set by database defaults
	}
	
	stmt := table.CourseThread.INSERT(table.CourseThread.MutableColumns).
		MODEL(insrt).
		RETURNING(table.CourseThread.AllColumns)

	courseThread := model.CourseThread{}
	err := stmt.Query(database.DB, &courseThread)

	return courseThread, err
}

// GetCourseThreadsByCourseID retrieves all threads for a specific course
func GetCourseThreadsByCourseID(courseId int) ([]model.CourseThread, error) {
	stmt := postgres.SELECT(
		table.CourseThread.ID, 
		table.CourseThread.UserId,
		table.CourseThread.CourseId,
		table.CourseThread.Title,
		table.CourseThread.CreatedAt,
		table.CourseThread.ModifiedAt,
	).FROM(
		table.CourseThread,
	).WHERE(
		table.CourseThread.CourseId.EQ(postgres.Int32(int32(courseId))),
	).ORDER_BY(
		table.CourseThread.CreatedAt.DESC(),
	)

	courseThreads := []model.CourseThread{}
	err := stmt.Query(database.DB, &courseThreads)
	
	return courseThreads, err
}

// GetCourseThreadByID retrieves a specific thread by ID
func GetCourseThreadByID(id int) (model.CourseThread, error) {
	stmt := postgres.SELECT(
		table.CourseThread.AllColumns,
	).FROM(
		table.CourseThread,
	).WHERE(
		table.CourseThread.ID.EQ(postgres.Int32(int32(id))),
	)

	courseThread := model.CourseThread{}
	err := stmt.Query(database.DB, &courseThread)
	
	return courseThread, err
}

// CreateCourseThreadResponse creates a new response to a course thread
func CreateCourseThreadResponse(appUserId int, threadID int, content string) (model.CourseThreadResponse, error) {
	insrt := model.CourseThreadResponse{
		UserId:         int32(appUserId),
		CourseThreadId: int32(threadID),
		Content:        content,
		// CreatedAt and ModifiedAt will be set by database defaults
	}
	
	stmt := table.CourseThreadResponse.INSERT(table.CourseThreadResponse.MutableColumns).
		MODEL(insrt).
		RETURNING(table.CourseThreadResponse.AllColumns)

	response := model.CourseThreadResponse{}
	err := stmt.Query(database.DB, &response)

	return response, err
}

// GetCourseThreadResponsesByThreadID retrieves all responses for a specific thread
func GetCourseThreadResponsesByThreadID(threadId int) ([]model.CourseThreadResponse, error) {
	stmt := postgres.SELECT(
		table.CourseThreadResponse.AllColumns,
	).FROM(
		table.CourseThreadResponse,
	).WHERE(
		table.CourseThreadResponse.CourseThreadId.EQ(postgres.Int32(int32(threadId))),
	)

	responses := []model.CourseThreadResponse{}
	err := stmt.Query(database.DB, &responses)
	
	return responses, err
}