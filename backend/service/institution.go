package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

func CreateInstitution(name string, continent string) (model.Institution, error) {
	insrt := model.Institution{
		Name:      name,
		Continent: &continent,
	}
	
	stmt := table.Institution.INSERT(table.Institution.MutableColumns).
		MODEL(insrt).
		RETURNING(table.Institution.AllColumns)

	institution := model.Institution{}
	err := stmt.Query(database.DB, &institution)

	return institution, err
}

func GetInstitutions() ([]model.Institution, error) {
	stmt := postgres.SELECT(
		table.Institution.ID, table.Institution.Name, table.Institution.Continent,
	).FROM(
		table.Institution,
	)

	institutions := []model.Institution{}
	err := stmt.Query(database.DB, &institutions)
	if err != nil {
		return nil, err
	}

	return institutions, nil
}

func GetInstitutionByID(id int) (model.Institution, error) {
	stmt := postgres.SELECT(
		table.Institution.AllColumns,
	).FROM(
		table.Institution,
	).WHERE(
		table.Institution.ID.EQ(postgres.Int32(int32(id))),
	)

	institution := model.Institution{}
	err := stmt.Query(database.DB, &institution)

	return institution, err
}

func UpdateInstitution(id int, name, continent string) (model.Institution, error) {
	stmt := table.Institution.UPDATE().
		SET(
			table.Institution.Name.SET(postgres.String(name)),
			table.Institution.Continent.SET(postgres.String(continent)),
		).WHERE(
			table.Institution.ID.EQ(postgres.Int32(int32(id))),
		).RETURNING(
			table.Institution.AllColumns,
		)

	institution := model.Institution{}
	err := stmt.Query(database.DB, &institution)
	if err != nil {
		return model.Institution{}, err
	}
	
	return institution, nil
}

func DeleteInstitution(id int) error {
	stmt := table.Institution.DELETE().WHERE(
		table.Institution.ID.EQ(postgres.Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}