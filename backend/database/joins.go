package database

type CourseThreadJoinResponses struct {
	Thread    CourseThread             `json:"thread"`
	Responses []CourseThreadResponse `json:"responses"`
}

type UserCourseJoinCourse struct {
	UserCourse UserCourse `json:"userCourse"`
	Course     Course     `json:"course"`
}

type CourseLessonSectionJoinBlocks struct {
	CourseLessonSection CourseLessonSection `json:"courseLessonSection"`
	Blocks              []CourseLessonSectionBlock `json:"blocks"`
}