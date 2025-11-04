import {
	getSubjectOfferingClassDetailsById,
	getTeachersBySubjectOfferingClassId
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();

	const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(subjectOfferingClassIdInt)) {
		throw new Error('Invalid subject offering class id');
	}

	const classDetails = await getSubjectOfferingClassDetailsById(subjectOfferingClassIdInt);
	if (!classDetails) {
		throw new Error('Class not found');
	}

	const teachers = await getTeachersBySubjectOfferingClassId(subjectOfferingClassIdInt);
	const primaryTeacher = teachers[0]?.teacher;

	const gradeData = {
		subject: {
			id: subjectOfferingClassIdInt,
			name: classDetails.subject.name,
			className: classDetails.subjectOfferingClass.name,
			teacher: primaryTeacher ? `${primaryTeacher.firstName} ${primaryTeacher.lastName}` : 'TBA',
			currentGrade: 82.5,
			letterGrade: 'B+'
		},
		gradeBreakdown: {
			homework: { current: 88, weight: 30 },
			assessments: { current: 78, weight: 60 },
			participation: { current: 92, weight: 10 }
		},
		tasks: [
			// Assessments (weights sum to 60)
			{
				id: 2001,
				name: 'Diagnostic Assessment',
				type: 'assessment' as const,
				studentGrade: 80,
				maxPoints: 100,
				weight: 10,
				dueDate: '2024-07-15',
				submittedDate: '2024-07-15',
				feedback: 'Solid start. Focus on showing working for partial credit.',
				status: 'graded' as const
			},
			{
				id: 2002,
				name: 'Functions Assessment',
				type: 'assessment' as const,
				studentGrade: 55,
				maxPoints: 100,
				weight: 25,
				dueDate: '2024-08-05',
				submittedDate: '2024-08-05',
				feedback: 'Good understanding of domain and range. Review composite functions.',
				status: 'graded' as const
			},
			{
				id: 2003,
				name: 'Quadratic Equations Assessment',
				type: 'assessment' as const,
				studentGrade: 75,
				maxPoints: 100,
				weight: 25,
				dueDate: '2024-08-12',
				submittedDate: '2024-08-12',
				feedback: 'Strong performance. Improve explanation of discriminant cases.',
				status: 'graded' as const
			},

			// Lessons (not weighted for grade calculation)
			{
				id: 1001,
				name: 'Linear Equations Lesson Practice',
				type: 'lesson' as const,
				studentGrade: 19,
				maxPoints: 20,
				weight: null,
				dueDate: '2024-07-22',
				submittedDate: '2024-07-22',
				feedback:
					'Excellent understanding of linear equations. Watch out for sign errors in step 3.',
				status: 'graded' as const
			},
			{
				id: 1004,
				name: 'Quadratic Functions Lesson',
				type: 'lesson' as const,
				studentGrade: 22,
				maxPoints: 25,
				weight: null,
				dueDate: '2024-08-01',
				submittedDate: '2024-08-01',
				feedback: 'Great participation in class discussion. Good grasp of parabola properties.',
				status: 'graded' as const
			},
			{
				id: 1007,
				name: 'Polynomial Operations Lesson',
				type: 'lesson' as const,
				studentGrade: 19,
				maxPoints: 20,
				weight: null,
				dueDate: '2024-08-12',
				submittedDate: '2024-08-12',
				feedback: 'Active participation and good questions during the lesson.',
				status: 'graded' as const
			},
			{
				id: 1009,
				name: 'Problem Solving Workshop',
				type: 'lesson' as const,
				studentGrade: 24,
				maxPoints: 25,
				weight: null,
				dueDate: '2024-08-15',
				submittedDate: '2024-08-15',
				feedback: 'Outstanding collaborative work and creative problem-solving approaches.',
				status: 'graded' as const
			},
			{
				id: 1013,
				name: 'Future Lesson Placeholder',
				type: 'lesson' as const,
				studentGrade: null,
				maxPoints: 20,
				weight: null,
				dueDate: '2024-09-05',
				submittedDate: null,
				feedback: null,
				status: 'pending' as const
			},

			// Homework (weights sum to 30)
			{
				id: 1002,
				name: 'Algebra Homework Set 1',
				type: 'homework' as const,
				studentGrade: 20,
				maxPoints: 40,
				weight: 8,
				dueDate: '2024-07-29',
				submittedDate: '2024-07-28',
				feedback: 'Good work overall. Need more practice with complex fractions.',
				status: 'graded' as const
			},
			{
				id: 1003,
				name: 'Trigonometry Homework',
				type: 'homework' as const,
				studentGrade: 20,
				maxPoints: 25,
				weight: 6,
				dueDate: '2024-08-19',
				submittedDate: '2024-08-19',
				feedback: 'Nice effort on identities. Revise angle sum and difference formulas.',
				status: 'graded' as const
			},
			{
				id: 1006,
				name: 'Graphing Practice Homework And Testing A Really Really Really Long Task Name',
				type: 'homework' as const,
				studentGrade: 24,
				maxPoints: 30,
				weight: 8,
				dueDate: '2024-08-05',
				submittedDate: '2024-08-05',
				feedback: 'Excellent work on coordinate plotting. Minor errors in slope calculations.',
				status: 'graded' as const
			},
			{
				id: 1008,
				name: 'Statistics Homework Set 2',
				type: 'homework' as const,
				studentGrade: 28,
				maxPoints: 35,
				weight: 3,
				dueDate: '2024-08-22',
				submittedDate: '2024-08-22',
				feedback: 'Great use of median and mode. Double-check variance steps.',
				status: 'graded' as const
			},
			{
				id: 1012,
				name: 'Calculus Introduction Homework',
				type: 'homework' as const,
				studentGrade: 32,
				maxPoints: 50,
				weight: 5,
				dueDate: '2024-08-30',
				submittedDate: '2024-08-29',
				feedback: 'Good effort on limits and derivatives. Review the chain rule applications.',
				status: 'graded' as const
			}
		],
		insights: {
			strengths: ['Participation in class', 'Problem-solving approach', 'Homework completion'],
			improvementAreas: ['Test accuracy', 'Complex calculations', 'Time management in exams'],
			nextSteps: [
				'Practice more timed tests',
				'Review calculation methods',
				'Ask for help with trigonometry'
			]
		}
	};

	return {
		gradeData
	};
};
