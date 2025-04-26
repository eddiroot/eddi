package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/service"
)

// Struct to combine thread and responses
type CourseThreadJoinResponses struct {
	Thread    model.CourseThread
	Responses []model.CourseThreadResponse
}

func GetUserCourses(c *gin.Context) {
	userRaw, _ := c.Get("user")
	user := userRaw.(model.User)

	userCourses, err := service.GetUserCoursesJoinCoursesByUserID(int(user.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user courses"})
		return
	}

	c.JSON(http.StatusOK, userCourses)
}

func CreateCourseThread(c *gin.Context) {
	var courseThread model.CourseThread
	if err := c.ShouldBindJSON(&courseThread); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	courseId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	userRaw, _ := c.Get("user")
	user := userRaw.(model.User)

	createdThread, err := service.CreateCourseThread(int(user.ID), courseId, courseThread.Title, courseThread.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course thread created", "id": createdThread.ID})
}

func GetCourseThreads(c *gin.Context) {
	courseId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	courseThreads, err := service.GetCourseThreadsByCourseID(courseId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve course threads"})
		return
	}

	c.JSON(http.StatusOK, courseThreads)
}

func GetCourseThread(c *gin.Context) {
	threadId, err := strconv.Atoi(c.Param("threadId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid thread ID"})
		return
	}

	thread, err := service.GetCourseThreadByID(threadId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve course threads"})
		return
	}

	responses, respErr := service.GetCourseThreadResponsesByThreadID(threadId)
	if respErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve course thread responses"})
		return
	}

	threadWithResponses := CourseThreadJoinResponses{
		Thread:    thread,
		Responses: responses,
	}

	c.JSON(http.StatusOK, threadWithResponses)
}

func CreateCourseThreadResponse(c *gin.Context) {
	threadId, err := strconv.Atoi(c.Param("threadId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid thread ID"})
		return
	}

	userRaw, _ := c.Get("user")
	user := userRaw.(model.User)

	var courseThreadResponse model.CourseThreadResponse
	if err := c.ShouldBindJSON(&courseThreadResponse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdResponse, err := service.CreateCourseThreadResponse(int(user.ID), threadId, courseThreadResponse.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course thread response"})
		return
	}

	c.JSON(http.StatusOK, createdResponse)
}

func GetCourseLessons(c *gin.Context) {
	courseId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	courseLessons, err := service.GetCourseLessonsByCourseID(courseId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve course lessons"})
		return
	}

	c.JSON(http.StatusOK, courseLessons)
}

func GetCourseLesson(c *gin.Context) {
	lessonId, err := strconv.Atoi(c.Param("lessonId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	lessonSectionsWithBlocks, err := service.GetCourseLessonSectionsWithBlocksByLessonID(lessonId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve course lesson sections with blocks"})
		return
	}

	c.JSON(http.StatusOK, lessonSectionsWithBlocks)
}
