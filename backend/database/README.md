When starting the web server, all migration scripts are run automatically.

Run this command to generate files for a new migration
`migrate create -ext sql -dir database/migrations/ -seq MIGRATION_NAME_HERE`

Run this command to migrate down the database:
`migrate -source file://database/migrations -database "sqlite3://eddy.db" down 1`