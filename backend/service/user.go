package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

// CreateUser creates a new user record
func CreateUser(firstName, middleName, lastName, username, password, avatarUrl string) (model.User, error) {
	insrt := model.User{
		FirstName:  firstName,
		MiddleName: &middleName,
		LastName:   lastName,
		Username:   username,
		Password:   password,
		AvatarUrl:  &avatarUrl,
	}
	
	stmt := table.User.INSERT(table.User.MutableColumns).
		MODEL(insrt).
		RETURNING(table.User.AllColumns)

	user := model.User{}
	err := stmt.Query(database.DB, &user)

	return user, err
}

// GetUsers retrieves all users
func GetUsers() ([]model.User, error) {
	stmt := postgres.SELECT(
		table.User.AllColumns,
	).FROM(
		table.User,
	)

	users := []model.User{}
	err := stmt.Query(database.DB, &users)
	
	return users, err
}

// GetUserByID retrieves a user by ID
func GetUserByID(id int) (model.User, error) {
	stmt := postgres.SELECT(
		table.User.AllColumns,
	).FROM(
		table.User,
	).WHERE(
		table.User.ID.EQ(postgres.Int32(int32(id))),
	)

	user := model.User{}
	err := stmt.Query(database.DB, &user)
	
	return user, err
}

// GetUserByUsername retrieves a user by username
func GetUserByUsername(username string) (model.User, error) {
	stmt := postgres.SELECT(
		table.User.AllColumns,
	).FROM(
		table.User,
	).WHERE(
		table.User.Username.EQ(postgres.String(username)),
	)

	user := model.User{}
	err := stmt.Query(database.DB, &user)
	
	return user, err
}

// UpdateUser updates a user record by ID
func UpdateUser(id int, firstName, middleName, lastName, username, password, avatarUrl string) (model.User, error) {
	stmt := table.User.UPDATE().
		SET(
			table.User.FirstName.SET(postgres.String(firstName)),
			table.User.MiddleName.SET(postgres.String(middleName)),
			table.User.LastName.SET(postgres.String(lastName)),
			table.User.Username.SET(postgres.String(username)),
			table.User.Password.SET(postgres.String(password)),
			table.User.AvatarUrl.SET(postgres.String(avatarUrl)),
		).WHERE(
			table.User.ID.EQ(postgres.Int32(int32(id))),
		).RETURNING(
			table.User.AllColumns,
		)

	user := model.User{}
	err := stmt.Query(database.DB, &user)
	if err != nil {
		return model.User{}, err
	}
	
	return user, nil
}

// DeleteUser deletes a user by ID
func DeleteUser(id int) error {
	stmt := table.User.DELETE().WHERE(
		table.User.ID.EQ(postgres.Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}