When starting the web server, all migration scripts are run automatically.

Run this command to generate files for a new migration
`migrate create -ext sql -dir database/migrations/ -seq MIGRATION_NAME_HERE`

Run this command to migrate down the database:
`migrate -source file://database/migrations -database "postgres://postgres:password@localhost:5432/eddy?sslmode=disable" down 1`

Run this command to generate latest types based on the database:
`jet -dsn="postgresql://postgres:postgres@localhost:5432/eddy?sslmode=disable" -schema=public -path="./.gen"`
