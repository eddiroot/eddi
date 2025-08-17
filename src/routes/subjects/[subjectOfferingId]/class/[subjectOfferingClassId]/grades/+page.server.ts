import {
    getSubjectOfferingClassDetailsById,
    getTeachersBySubjectOfferingClassId,
    getAssessmentsBySubjectOfferingClassId
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
    security.isAuthenticated();

    const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);

    const classDetails = await getSubjectOfferingClassDetailsById(subjectOfferingClassIdInt);
    if (!classDetails) {
        throw new Error('Class not found');
    }

    const teachers = await getTeachersBySubjectOfferingClassId(subjectOfferingClassIdInt);
    const primaryTeacher = teachers[0]?.teacher;

    const assessments = await getAssessmentsBySubjectOfferingClassId(subjectOfferingClassIdInt);

    const gradeData = {
        subject: {
            id: subjectOfferingClassIdInt,
            name: classDetails.subject.name,
            className: classDetails.subjectOfferingClass.name,
            teacher: primaryTeacher ? `${primaryTeacher.firstName} ${primaryTeacher.lastName}` : "TBA",
            currentGrade: 82.5,
            letterGrade: "B+",
        },
        gradeBreakdown: {
            homework: { current: 88, weight: 30 },
            assessments: { current: 78, weight: 60 },
            participation: { current: 92, weight: 10 }
        },
        gradeHistory: [
            { date: "2024-07-15", grade: 68, task: "Diagnostic Assessment" },
            { date: "2024-07-22", grade: 72, task: "Linear Equations Lesson" },
            { date: "2024-07-29", grade: 75, task: "Algebra Homework Set 1" },
            { date: "2024-08-05", grade: 78, task: "Functions Assessment" },
            { date: "2024-08-12", grade: 82.5, task: "Quadratic Equations Assessment" },
            { date: "2024-08-17", grade: 82.5, task: "Current" }
        ],
        tasks: [
            ...assessments.map((assessment) => ({
                id: assessment.subjectOfferingClassTask.id,
                name: assessment.task.title,
                type: "assessment" as const,
                studentGrade: Math.floor(Math.random() * 30) + 70, // Mock grade 70-100
                maxPoints: 100,
                weight: 30,
                dueDate: assessment.subjectOfferingClassTask.dueDate?.toISOString().split('T')[0] || "2024-08-20",
                submittedDate: "2024-08-19" as string | null,
                feedback: "Good work on this assessment. Keep focusing on detailed explanations." as string | null,
                status: "graded" as const
            })),
            {
                id: 1001,
                name: "Linear Equations Lesson Practice",
                type: "lesson" as const,
                studentGrade: 18,
                maxPoints: 20,
                weight: null,
                dueDate: "2024-07-22",
                submittedDate: "2024-07-22",
                feedback: "Excellent understanding of linear equations. Watch out for sign errors in step 3.",
                status: "graded" as const
            },
            {
                id: 1002,
                name: "Algebra Homework Set 1",
                type: "homework" as const,
                studentGrade: 34,
                maxPoints: 40,
                weight: 8,
                dueDate: "2024-07-29",
                submittedDate: "2024-07-28",
                feedback: "Good work overall. Need more practice with complex fractions.",
                status: "graded" as const
            },
            {
                id: 1003,
                name: "Trigonometry Homework",
                type: "homework" as const,
                studentGrade: null,
                maxPoints: 25,
                weight: 6,
                dueDate: "2024-08-19",
                submittedDate: null,
                feedback: null,
                status: "pending" as const
            },
            {
                id: 1004,
                name: "Quadratic Functions Lesson",
                type: "lesson" as const,
                studentGrade: 22,
                maxPoints: 25,
                weight: null,
                dueDate: "2024-08-01",
                submittedDate: "2024-08-01",
                feedback: "Great participation in class discussion. Good grasp of parabola properties. Don't use pen to draw the axis. Make sure to label axis aswell.",
                status: "graded" as const
            },
            {
                id: 1005,
                name: "Mid-Term Assessment",
                type: "assessment" as const,
                studentGrade: 76,
                maxPoints: 100,
                weight: 25,
                dueDate: "2024-08-08",
                submittedDate: "2024-08-08",
                feedback: "Solid performance overall. Work on factoring techniques for improvement.",
                status: "graded" as const
            },
            {
                id: 1006,
                name: "Graphing Practice Homework And Testing A Really Really Really Long Task Name",
                type: "homework" as const,
                studentGrade: 28,
                maxPoints: 30,
                weight: 8,
                dueDate: "2024-08-05",
                submittedDate: "2024-08-05",
                feedback: "Excellent work on coordinate plotting. Minor errors in slope calculations.",
                status: "graded" as const
            },
            {
                id: 1007,
                name: "Polynomial Operations Lesson",
                type: "lesson" as const,
                studentGrade: 19,
                maxPoints: 20,
                weight: null,
                dueDate: "2024-08-12",
                submittedDate: "2024-08-12",
                feedback: "Active participation and good questions during the lesson.",
                status: "graded" as const
            },
            {
                id: 1008,
                name: "Statistics Homework Set 2",
                type: "homework" as const,
                studentGrade: null,
                maxPoints: 35,
                weight: 3,
                dueDate: "2024-08-22",
                submittedDate: null,
                feedback: null,
                status: "pending" as const
            },
            {
                id: 1009,
                name: "Problem Solving Workshop",
                type: "lesson" as const,
                studentGrade: 24,
                maxPoints: 25,
                weight: null,
                dueDate: "2024-08-15",
                submittedDate: "2024-08-15",
                feedback: "Outstanding collaborative work and creative problem-solving approaches.",
                status: "graded" as const
            },
            {
                id: 1010,
                name: "Unit 3 Assessment - Functions",
                type: "assessment" as const,
                studentGrade: null,
                maxPoints: 100,
                weight: 25,
                dueDate: "2024-08-25",
                submittedDate: null,
                feedback: null,
                status: "pending" as const
            },
            {
                id: 1011,
                name: "Logarithms and Exponentials Lesson",
                type: "lesson" as const,
                studentGrade: 23,
                maxPoints: 25,
                weight: null,
                dueDate: "2024-08-18",
                submittedDate: "2024-08-18",
                feedback: "Excellent understanding of logarithmic properties. Keep practicing with change of base formula.",
                status: "graded" as const
            },
            {
                id: 1012,
                name: "Calculus Introduction Homework",
                type: "homework" as const,
                studentGrade: 42,
                maxPoints: 50,
                weight: 5,
                dueDate: "2024-08-30",
                submittedDate: "2024-08-29",
                feedback: "Good effort on limits and derivatives. Review the chain rule applications.",
                status: "graded" as const
            },
            {
                id: 1013,
                name: "Data Analysis Project",
                type: "assessment" as const,
                studentGrade: null,
                maxPoints: 80,
                weight: 10,
                dueDate: "2024-09-05",
                submittedDate: null,
                feedback: null,
                status: "pending" as const
            }
        ],
        insights: {
            strengths: ["Participation in class", "Problem-solving approach", "Homework completion"],
            improvementAreas: ["Test accuracy", "Complex calculations", "Time management in exams"],
            nextSteps: ["Practice more timed tests", "Review calculation methods", "Ask for help with trigonometry"]
        }
    };

    return {
        gradeData
    };
};
