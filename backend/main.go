package main

import (
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file" // File source driver - DO NOT REMOVE
	_ "github.com/lib/pq"                                // PostgreSQL driver - DO NOT REMOVE

	"github.com/gin-gonic/gin"
)

func main() {
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
	// Protected routes for Institution and Admin
    institutionGroup := r.Group("/institutions")
    institutionGroup.Use(APIKeyAuthMiddleware())
    {
        institutionGroup.POST("/", createInstitution)
        institutionGroup.GET("/", getInstitutions)
        institutionGroup.GET("/:id", getInstitutionByID)
        institutionGroup.PUT("/:id", updateInstitution)
        institutionGroup.DELETE("/:id", deleteInstitution)
    }

    adminGroup := r.Group("/admins")
    adminGroup.Use(APIKeyAuthMiddleware())
    {
        adminGroup.POST("/", createAdmin)
        adminGroup.GET("/", getAdmins)
        adminGroup.GET("/:id", getAdminByID)
        adminGroup.PUT("/:id", updateAdmin)
        adminGroup.DELETE("/:id", deleteAdmin)
    }

    // Protected routes for AppUser and Course
    appUserGroup := r.Group("/appusers")
    appUserGroup.Use(JWTAuthMiddleware())
    {
        appUserGroup.POST("/", createAppUser)
        appUserGroup.GET("/", getAppUsers)
        appUserGroup.GET("/:id", getAppUserByID)
        appUserGroup.PUT("/:id", updateAppUser)
        appUserGroup.DELETE("/:id", deleteAppUser)
    }

    courseGroup := r.Group("/courses")
    courseGroup.Use(JWTAuthMiddleware())
    {
        courseGroup.POST("/", createCourse)
        courseGroup.GET("/", getCourses)
        courseGroup.GET("/:id", getCourseByID)
        courseGroup.PUT("/:id", updateCourse)
        courseGroup.DELETE("/:id", deleteCourse)
    }

	r.Run() // listen and serve on 0.0.0.0:8080
}