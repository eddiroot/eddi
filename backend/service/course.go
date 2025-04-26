package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

// CreateCourse creates a new course record
func CreateCourse(institutionID int, name, description string) (model.Course, error) {
	insrt := model.Course{
		InstitutionId: int32(institutionID),
		Name:          name,
		Description:   description,
	}
	
	stmt := table.Course.INSERT(table.Course.MutableColumns).
		MODEL(insrt).
		RETURNING(table.Course.AllColumns)

	course := model.Course{}
	err := stmt.Query(database.DB, &course)

	return course, err
}

// GetCourses retrieves all courses
func GetCourses() ([]model.Course, error) {
	stmt := postgres.SELECT(
		table.Course.AllColumns,
	).FROM(
		table.Course,
	)

	courses := []model.Course{}
	err := stmt.Query(database.DB, &courses)
	
	return courses, err
}

// GetCourseByID retrieves a course by ID
func GetCourseByID(id int) (model.Course, error) {
	stmt := postgres.SELECT(
		table.Course.AllColumns,
	).FROM(
		table.Course,
	).WHERE(
		table.Course.ID.EQ(postgres.Int32(int32(id))),
	)

	course := model.Course{}
	err := stmt.Query(database.DB, &course)
	
	return course, err
}

// UpdateCourse updates a course record by ID
func UpdateCourse(id int, institutionID int, name, description string) (model.Course, error) {
	stmt := table.Course.UPDATE().
		SET(
			table.Course.InstitutionId.SET(postgres.Int32(int32(institutionID))),
			table.Course.Name.SET(postgres.String(name)),
			table.Course.Description.SET(postgres.String(description)),
		).WHERE(
			table.Course.ID.EQ(postgres.Int32(int32(id))),
		)

	// Execute the update
	_, err := stmt.Exec(database.DB)
	if err != nil {
		return model.Course{}, err
	}
	
	// Fetch the updated object
	return GetCourseByID(id)
}

// DeleteCourse deletes a course by ID
func DeleteCourse(id int) error {
	stmt := table.Course.DELETE().WHERE(
		table.Course.ID.EQ(postgres.Int32(int32(id))),
	)

	_, err := stmt.Exec(database.DB)
	return err
}