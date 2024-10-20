package main

import (
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file" // File source driver - DO NOT REMOVE

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq" // PostgreSQL driver - DO NOT REMOVE
)

func main() {
	LoadAndValidateEnvVariables()

	// Setup database connection
	InitialiseDB()

	// Will only close once main is finished
	defer db.Close()

	// Create the database driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("Failed to create PostgreSQL driver instance: %v", err)
	}

	// Setup migration
	m, err := migrate.NewWithDatabaseInstance(
		"file://database/migrations",
		"postgres", driver)
	if err != nil {
		log.Fatalf("Failed to initialise migrations: %v", err)
	}

	// Apply migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	} else if err == migrate.ErrNoChange {
		log.Println("No new migrations to apply.")
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://opened.com", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Language", "Accept-Encoding", "Connection", "Access-Control-Allow-Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/signup", Signup)
		authGroup.POST("/login", Login)
		authGroup.POST("/logout", Logout)
	}

	appGroup := r.Group("/app")
	appGroup.Use(JWTAuthMiddleware())
	{
		userCoursesGroup := appGroup.Group("/userCourses")
		{
			userCoursesGroup.GET("/:id", getUserCoursesByUserID)
		}

		coursesGroup := appGroup.Group("/courses")
		{
			coursesGroup.GET("/:id", getCourseByID)
		}

	}

	apiGroup := r.Group("/api/v1")
	apiGroup.Use(APIKeyAuthMiddleware())
	{
		institutionGroup := apiGroup.Group("/institutions")
		{
			institutionGroup.POST("/", createInstitution)
			institutionGroup.GET("/", getInstitutions)
			institutionGroup.GET("/:id", getInstitutionByID)
			institutionGroup.PUT("/:id", updateInstitution)
			institutionGroup.DELETE("/:id", deleteInstitution)
		}

		adminGroup := apiGroup.Group("/admins")
		{
			adminGroup.POST("/", createAdmin)
			adminGroup.GET("/", getAdmins)
			adminGroup.GET("/:id", getAdminByID)
			adminGroup.PUT("/:id", updateAdmin)
			adminGroup.DELETE("/:id", deleteAdmin)
		}

		// Protected routes for User and Course
		userGroup := apiGroup.Group("/users")
		{
			userGroup.POST("/", createUser)
			userGroup.GET("/", getUsers)
			userGroup.GET("/:id", getUserByID)
			userGroup.PUT("/:id", updateUser)
			userGroup.DELETE("/:id", deleteUser)
		}

		courseGroup := apiGroup.Group("/courses")
		{
			courseGroup.POST("/", createCourse)
			courseGroup.GET("/", getCourses)
			courseGroup.GET("/:id", getCourseByID)
			courseGroup.PUT("/:id", updateCourse)
			courseGroup.DELETE("/:id", deleteCourse)
		}

		userCourseGroup := apiGroup.Group("/userCourses")
		{
			userCourseGroup.POST("/", createUserCourse)
		}
	}

	r.Run()
}
