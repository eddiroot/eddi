export enum yearLevelEnum {
	none = 'N',
	foundation = 'F',
	year1 = '1',
	year2 = '2',
	year3 = '3',
	year4 = '4',
	year5 = '5',
	year6 = '6',
	year7 = '7',
	year8 = '8',
	year9 = '9',
	year10 = '10',
	year10A = '10A',
	year11 = '11',
	year12 = '12',
	year13 = '13'
}

export enum schoolSpaceTypeEnum {
	classroom = 'classroom',
	laboratory = 'laboratory',
	gymnasium = 'gymnasium',
	pool = 'pool',
	library = 'library',
	auditorium = 'auditorium'
}

export enum userSubjectOfferingRoleEnum {
	student = 'student',
	teacher = 'teacher',
	moderator = 'moderator'
}

export enum userSubjectOfferingClassRoleEnum {
	student = 'student',
	teacher = 'teacher'
}

export enum subjectThreadTypeEnum {
	discussion = 'discussion',
	question = 'question',
	announcement = 'announcement',
	qanda = 'qanda'
}

export enum subjectThreadResponseTypeEnum {
	comment = 'comment',
	answer = 'answer'
}

export enum taskTypeEnum {
	lesson = 'lesson',
	assessment = 'assessment',
	homework = 'homework'
}

export enum taskBlockTypeEnum {
	h1 = 'h1',
	h2 = 'h2',
	h3 = 'h3',
	h4 = 'h4',
	h5 = 'h5',
	h6 = 'h6',
	markdown = 'markdown',
	image = 'image',
	video = 'video',
	audio = 'audio',
	fillInBlank = 'fill_in_blank',
	multipleChoice = 'multiple_choice',
	whiteboard = 'whiteboard',
	matching = 'matching',
	twoColumnLayout = 'two_column_layout',
	shortAnswer = 'short_answer'
}

export enum taskStatusEnum {
	draft = 'draft', // Lesson/Assessment/Homework
	inProgress = 'in_progress', // Lesson
	completed = 'completed', // Lesson
	published = 'published', //Assessment/Homework
	locked = 'locked', // Assessment/Homework
	released = 'released' // Assessment/Homework
}

export enum taskBlockResponseStatusEnum {
	editPermission = 'edit_permission', // Student can edit their response
	submitted = 'submitted', // Student has submitted their response
	graded = 'graded' // Teacher has graded the response
}

export enum whiteboardObjectTypeEnum {
	rect = 'Rect',
	circle = 'Circle',
	path = 'Path',
	textbox = 'Textbox'
}

export enum userTypeEnum {
	student = 'student',
	teacher = 'teacher',
	guardian = 'guardian',
	principal = 'principal',
	schoolAdmin = 'schoolAdmin',
	systemAdmin = 'systemAdmin'
}

export enum userHonorificEnum {
	mr = 'Mr',
	ms = 'Ms',
	mrs = 'Mrs',
	dr = 'Dr',
	prof = 'Prof'
}

export enum userGenderEnum {
	male = 'male',
	female = 'female',
	nonBinary = 'non-binary',
	other = 'other',
	unspecified = 'unspecified'
}

export enum relationshipTypeEnum {
	mother = 'mother',
	father = 'father',
	guardian = 'guardian'
}

export enum queueStatusEnum {
	queued = 'queued',
	inProgress = 'in_progress',
	completed = 'completed',
	failed = 'failed'
}
