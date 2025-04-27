package service

import (
	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

type LessonSectionWithBlocks struct {
	model.CourseLessonSection
	Blocks []model.CourseLessonSectionBlock `json:"blocks"`
}

func GetCourseLessonsByCourseID(courseId int) ([]model.CourseLesson, error) {
	stmt := postgres.SELECT(
		table.CourseLesson.AllColumns,
	).FROM(
		table.CourseLesson,
	).WHERE(
		table.CourseLesson.CourseId.EQ(postgres.Int32(int32(courseId))),
	).ORDER_BY(
		table.CourseLesson.CourseWeek.ASC(),
	)

	courseLessons := []model.CourseLesson{}
	err := stmt.Query(database.DB, &courseLessons)
	
	return courseLessons, err
}

func GetCourseLessonSectionsWithBlocksByLessonID(lessonId int) ([]LessonSectionWithBlocks, error) {
	// Get all sections for this lesson
	sectionStmt := postgres.SELECT(
		table.CourseLessonSection.AllColumns,
	).FROM(
		table.CourseLessonSection,
	).WHERE(
		table.CourseLessonSection.CourseLessonId.EQ(postgres.Int32(int32(lessonId))),
	)

	sections := []model.CourseLessonSection{}
	err := sectionStmt.Query(database.DB, &sections)
	if err != nil {
		return nil, err
	}

	result := make([]LessonSectionWithBlocks, len(sections))

	for i, section := range sections {
		result[i] = LessonSectionWithBlocks{
			CourseLessonSection: section,
			Blocks:              []model.CourseLessonSectionBlock{},
		}

		blockStmt := postgres.SELECT(
			table.CourseLessonSectionBlock.AllColumns,
		).FROM(
			table.CourseLessonSectionBlock,
		).WHERE(
			table.CourseLessonSectionBlock.CourseLessonSectionId.EQ(postgres.Int32(section.ID)),
		)

		blocks := []model.CourseLessonSectionBlock{}
		err := blockStmt.Query(database.DB, &blocks)
		if err != nil {
			return nil, err
		}

		result[i].Blocks = blocks
	}

	return result, nil
}