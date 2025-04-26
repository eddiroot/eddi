package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

// CreateAdmin creates a new admin record
func CreateAdmin(institutionID int, username, password string) (model.Admin, error) {
	insrt := model.Admin{
		InstitutionId: int32(institutionID),
		Username:      username,
		Password:      password,
	}
	
	stmt := table.Admin.INSERT(table.Admin.MutableColumns).
		MODEL(insrt).
		RETURNING(table.Admin.AllColumns)

	admin := model.Admin{}
	err := stmt.Query(database.DB, &admin)

	return admin, err
}

// GetAdmins retrieves all admins
func GetAdmins() ([]model.Admin, error) {
	stmt := postgres.SELECT(
		table.Admin.AllColumns,
	).FROM(
		table.Admin,
	)

	admins := []model.Admin{}
	err := stmt.Query(database.DB, &admins)
	
	return admins, err
}

// GetAdminByID retrieves an admin by ID
func GetAdminByID(id int) (model.Admin, error) {
	stmt := postgres.SELECT(
		table.Admin.AllColumns,
	).FROM(
		table.Admin,
	).WHERE(
		table.Admin.ID.EQ(postgres.Int32(int32(id))),
	)

	admin := model.Admin{}
	err := stmt.Query(database.DB, &admin)
	
	return admin, err
}

// UpdateAdmin updates an admin record by ID
func UpdateAdmin(id int, institutionID int, username, password string) (model.Admin, error) {
	stmt := table.Admin.UPDATE().
		SET(
			table.Admin.InstitutionId.SET(postgres.Int32(int32(institutionID))),
			table.Admin.Username.SET(postgres.String(username)),
			table.Admin.Password.SET(postgres.String(password)),
		).WHERE(
			table.Admin.ID.EQ(postgres.Int32(int32(id))),
		).RETURNING(
			table.Admin.AllColumns,
		 )

	admin := model.Admin{}
	err := stmt.Query(database.DB, &admin)
	if err != nil {
		return model.Admin{}, err
	}
	
	return admin, nil
}

// DeleteAdmin deletes an admin by ID
func DeleteAdmin(id int) error {
	stmt := table.Admin.DELETE().WHERE(
		table.Admin.ID.EQ(postgres.Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}