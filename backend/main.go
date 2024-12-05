package main

import (
	"time"

	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/lachlanmacphee/eddy/database"
	"github.com/lachlanmacphee/eddy/handlers"
	"github.com/lachlanmacphee/eddy/lib"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	lib.LoadAndValidateEnvVariables()

	// Setup database connection
	database.InitialiseDB()

	// Will only close once main is finished
	defer database.DB.Close()

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://eddy.io", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Language", "Accept-Encoding", "Connection", "Access-Control-Allow-Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/signup", handlers.Signup)
		authGroup.POST("/login", handlers.Login)
		authGroup.POST("/logout", handlers.Logout)
	}

	appGroup := r.Group("/app")
	appGroup.Use(handlers.JWTAuthMiddleware())
	{
		userGroup := appGroup.Group("/user")
		{
			userGroup.GET("/courses", handlers.GetUserCourses)
		}

		coursesGroup := appGroup.Group("/courses")
		{
			coursesGroup.GET("/:id", handlers.GetCourse)
			coursesGroup.GET("/:id/threads", handlers.GetCourseThreads)
			coursesGroup.POST("/:id/threads", handlers.CreateCourseThread)
			coursesGroup.GET("/:id/threads/:threadId", handlers.GetCourseThread)
			coursesGroup.GET("/:id/lessons", handlers.GetCourseLessons)
			coursesGroup.GET("/:id/lessons/:lessonId", handlers.GetCourseLessonSectionsWithBlocks)
		}

	}

	apiGroup := r.Group("/api/v1")
	apiGroup.Use(handlers.APIKeyAuthMiddleware())
	{
		institutionGroup := apiGroup.Group("/institutions")
		{
			institutionGroup.POST("/", handlers.CreateInstitution)
			institutionGroup.GET("/", handlers.GetInstitutions)
			institutionGroup.GET("/:id", handlers.GetInstitutionByID)
			institutionGroup.PUT("/:id", handlers.UpdateInstitution)
			institutionGroup.DELETE("/:id", handlers.DeleteInstitution)
		}

		adminGroup := apiGroup.Group("/admins")
		{
			adminGroup.POST("/", handlers.CreateAdmin)
			adminGroup.GET("/", handlers.GetAdmins)
			adminGroup.GET("/:id", handlers.GetAdminByID)
			adminGroup.PUT("/:id", handlers.UpdateAdmin)
			adminGroup.DELETE("/:id", handlers.DeleteAdmin)
		}

		// Protected routes for User and Course
		userGroup := apiGroup.Group("/users")
		{
			userGroup.POST("/", handlers.CreateUser)
			userGroup.GET("/", handlers.GetUsers)
			userGroup.GET("/:id", handlers.GetUserByID)
			userGroup.PUT("/:id", handlers.UpdateUser)
			userGroup.DELETE("/:id", handlers.DeleteUser)
		}
		
		courseGroup := apiGroup.Group("/courses")
		{
			courseGroup.POST("/", handlers.CreateCourse)
			courseGroup.GET("/", handlers.GetCourses)
			courseGroup.GET("/:id", handlers.GetCourse)
			courseGroup.PUT("/:id", handlers.UpdateCourse)
			courseGroup.DELETE("/:id", handlers.DeleteCourse)
		}

		userCourseGroup := apiGroup.Group("/userCourses")
		{
			userCourseGroup.POST("/", handlers.CreateUserCourse)
		}
	}

	r.Run()
}
