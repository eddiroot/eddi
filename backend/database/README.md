Run this command to generate files for a new migration
`migrate create -ext sql -dir database/migrations/ -seq MIGRATION_NAME_HERE`

Run this command to migrate down the database:
`migrate -source file://database/migrations -database "postgresql://postgres:password@localhost:5432/opened?sslmode=disable" down 1`