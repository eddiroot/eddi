package lib

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

const ENV_GIN_MODE = "GIN_MODE"
const ENV_PORT = "PORT"
const ENV_DATABASE_URL = "DATABASE_URL"
const ENV_AUTH_ADMIN_API_KEY = "AUTH_ADMIN_API_KEY"
const ENV_AUTH_JWT_SECRET_KEY = "AUTH_JWT_SECRET_KEY"

func LoadAndValidateEnvVariables() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file. Ignore this if running in Docker.")
	}

	// Make sure GIN_MODE is present
	if os.Getenv(ENV_GIN_MODE) == "" {
		log.Fatal("Env: gin mode is missing")
	}

	// Make sure PORT is present
	if os.Getenv(ENV_PORT) == "" {
		log.Fatal("Env: port is missing")
	}

	// Make sure DATABASE_URL is present
	if os.Getenv(ENV_DATABASE_URL) == "" {
		log.Fatal("Env: database URL is missing")
	}

	// Make sure auth secrets are there
	if os.Getenv(ENV_AUTH_ADMIN_API_KEY) == "" {
		log.Fatal("Env: auth admin api key missing")
	}
	if os.Getenv(ENV_AUTH_JWT_SECRET_KEY) == "" {
		log.Fatal("Env: auth jwt secret key missing")
	}
}
