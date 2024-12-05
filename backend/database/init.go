package database

import (
	"database/sql"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/lachlanmacphee/eddy/lib"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitialiseDB() {
	var err error

	DB, err = sql.Open("sqlite3", os.Getenv(lib.ENV_DATABASE_URL))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Test the database connection
	if err = DB.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to the database successfully!")

	// Create the database driver instance
	driver, err := sqlite3.WithInstance(DB, &sqlite3.Config{})
	if err != nil {
		log.Fatalf("Failed to create sqlite driver instance: %v", err)
	}

	// Setup migration
	m, err := migrate.NewWithDatabaseInstance(
		"file://database/migrations",
		"sqlite3", driver)
	if err != nil {
		log.Fatalf("Failed to initialise migrations: %v", err)
	}

	// Apply migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	} else if err == migrate.ErrNoChange {
		log.Println("No new migrations to apply.")
	}
}