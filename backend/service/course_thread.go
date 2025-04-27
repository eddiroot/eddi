package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

func CreateCourseThread(appUserId int, courseId int, title string, content string) (model.CourseThread, error) {
	insrt := model.CourseThread{
		UserId:   int32(appUserId),
		CourseId: int32(courseId),
		Title:    title,
		Content:  content,
	}
	
	stmt := table.CourseThread.INSERT(table.CourseThread.MutableColumns).
		MODEL(insrt).
		RETURNING(table.CourseThread.AllColumns)

	courseThread := model.CourseThread{}
	err := stmt.Query(database.DB, &courseThread)

	return courseThread, err
}

func GetCourseThreadsByCourseID(courseId int) ([]model.CourseThread, error) {
	stmt := postgres.SELECT(
		table.CourseThread.AllColumns,
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

type CourseThreadWithResponses struct {
	Thread    model.CourseThread
	Responses []model.CourseThreadResponse
}

func GetCourseThreadWithResponsesByID(id int) (CourseThreadWithResponses, error) {
	thread, err := GetCourseThreadByID(id)
	if err != nil {
		return CourseThreadWithResponses{}, err
	}
	
	responses, err := GetCourseThreadResponsesByThreadID(id)
	if err != nil {
		return CourseThreadWithResponses{}, err
	}
	
	return CourseThreadWithResponses{
		Thread:    thread,
		Responses: responses,
	}, nil
}

func CreateCourseThreadResponse(appUserId int, threadID int, content string) (model.CourseThreadResponse, error) {
	insrt := model.CourseThreadResponse{
		UserId:         int32(appUserId),
		CourseThreadId: int32(threadID),
		Content:        content,
	}
	
	stmt := table.CourseThreadResponse.INSERT(table.CourseThreadResponse.MutableColumns).
		MODEL(insrt).
		RETURNING(table.CourseThreadResponse.AllColumns)

	response := model.CourseThreadResponse{}
	err := stmt.Query(database.DB, &response)

	return response, err
}

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