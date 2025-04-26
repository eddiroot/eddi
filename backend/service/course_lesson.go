package service

import (
	"database/sql"

	"github.com/go-jet/jet/v2/postgres"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/table"
	"github.com/lachlanmacphee/eddy/database"
)

// LessonSectionData represents a section in a course lesson
type LessonSectionData struct {
	ID             int
	CourseLessonID int
	Title          string
}

// LessonSectionBlockData represents a content block in a lesson section
type LessonSectionBlockData struct {
	ID          int
	Title       string
	Description string
	Type        string
}

// LessonSectionWithBlocks combines a section with its blocks
type LessonSectionWithBlocks struct {
	Section LessonSectionData
	Blocks  []LessonSectionBlockData
}

// GetCourseLessonsByCourseID retrieves all lessons for a specific course
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

// GetCourseLessonSectionsWithBlocksByLessonID retrieves all sections with their blocks for a lesson
func GetCourseLessonSectionsWithBlocksByLessonID(lessonId int) ([]LessonSectionWithBlocks, error) {
	stmt := postgres.SELECT(
		table.CourseLessonSection.ID,
		table.CourseLessonSection.CourseLessonId,
		table.CourseLessonSection.Title,
		table.CourseLessonSectionBlock.ID,
		table.CourseLessonSectionBlock.Title,
		table.CourseLessonSectionBlock.Description,
		table.CourseLessonSectionBlock.Type,
	).FROM(
		table.CourseLessonSection.
			LEFT_JOIN(table.CourseLessonSectionBlock, 
				table.CourseLessonSection.ID.EQ(table.CourseLessonSectionBlock.CourseLessonSectionId)),
	).WHERE(
		table.CourseLessonSection.CourseLessonId.EQ(postgres.Int32(int32(lessonId))),
	)

	var results []struct {
		SectionID      sql.NullInt64  `sql:"id"`
		CourseLessonId int32          `sql:"courseLessonId"`
		SectionTitle   sql.NullString `sql:"title"`
		BlockID        sql.NullInt64  `sql:"id_1"` // Second 'id' column gets aliased to id_1
		BlockTitle     sql.NullString `sql:"title_1"` // Second 'title' column gets aliased to title_1
		BlockDesc      sql.NullString `sql:"description"`
		BlockType      sql.NullString `sql:"type"`
	}

	err := stmt.Query(database.DB, &results)
	if err != nil {
		return nil, err
	}

	// Map to hold sections and avoid duplicates
	sectionMap := make(map[int]*LessonSectionWithBlocks)

	for _, r := range results {
		if !r.SectionID.Valid {
			continue
		}
		
		sectionID := int(r.SectionID.Int64)
		
		// Check if the section already exists in the map
		section, exists := sectionMap[sectionID]
		if !exists {
			// Create a new section
			section = &LessonSectionWithBlocks{
				Section: LessonSectionData{
					ID:             sectionID,
					CourseLessonID: int(r.CourseLessonId),
					Title:          r.SectionTitle.String,
				},
				Blocks: []LessonSectionBlockData{},
			}
			sectionMap[sectionID] = section
		}

		// Only add a block if it exists (blockID is not NULL)
		if r.BlockID.Valid {
			block := LessonSectionBlockData{
				ID:          int(r.BlockID.Int64),
				Title:       r.BlockTitle.String,
				Description: r.BlockDesc.String,
				Type:        r.BlockType.String,
			}
			section.Blocks = append(section.Blocks, block)
		}
	}

	// Convert the map values to a slice
	var lessonSectionsWithBlocks []LessonSectionWithBlocks
	for _, section := range sectionMap {
		lessonSectionsWithBlocks = append(lessonSectionsWithBlocks, *section)
	}

	return lessonSectionsWithBlocks, nil
}