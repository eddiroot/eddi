package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lachlanmacphee/eddy/database"
	"github.com/lachlanmacphee/eddy/service"
)

func CreateUserCourse(c *gin.Context) {
	var userCourse database.UserCourse
	if err := c.ShouldBindJSON(&userCourse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId, courseId, err := service.CreateUserCourse(userCourse.UserID, userCourse.CourseID, userCourse.Year, userCourse.Semester, userCourse.Role, userCourse.IsComplete, userCourse.IsArchived)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added user to course", "userId": userId, "courseId": courseId})
}