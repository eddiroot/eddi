package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/service"
)

func CreateUserCourse(c *gin.Context) {
	var userCourse model.UserCourse
	if err := c.ShouldBindJSON(&userCourse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdUserCourse, err := service.CreateUserCourse(int(userCourse.UserId), int(userCourse.CourseId), int(userCourse.Year), int(userCourse.Semester), *userCourse.Role, *userCourse.IsComplete, *userCourse.IsArchived)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added user to course", "userId": createdUserCourse.UserId, "courseId": createdUserCourse.CourseId})
}