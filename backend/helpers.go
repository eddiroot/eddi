package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

const ENV_AUTH_ADMIN_API_KEY = "AUTH_ADMIN_API_KEY"
const ENV_AUTH_JWT_SECRET_KEY = "AUTH_JWT_SECRET_KEY"

func LoadAndValidateEnvVariables() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Make sure auth secrets are there
	if os.Getenv(ENV_AUTH_ADMIN_API_KEY) == "" {
		log.Fatal("Env: auth admin api key missing")
	}
	if os.Getenv(ENV_AUTH_JWT_SECRET_KEY) == "" {
		log.Fatal("Env: auth jwt secret key missing")
	}
}
