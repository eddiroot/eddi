export const steps = {
	times: {
		percentage: 10,
		label: 'Times',
		previous: null,
		next: 'subjects'
	},
	subjects: {
		percentage: 20,
		label: 'Subjects',
		previous: 'times',
		next: 'teachers'
	},
	teachers: {
		percentage: 30,
		label: 'Teachers',
		previous: 'subjects',
		next: 'students'
	},
	students: {
		percentage: 40,
		label: 'Students',
		previous: 'teachers',
		next: 'buildings'
	},
	buildings: {
		percentage: 50,
		label: 'Buildings',
		previous: 'students',
		next: 'spaces'
	},
	spaces: {
		percentage: 60,
		label: 'Spaces',
		previous: 'buildings',
		next: 'activities'
	},
	activities: {
		percentage: 70,
		label: 'Activities',
		previous: 'spaces',
		next: 'constraints'
	},
	constraints: {
		percentage: 80,
		label: 'Constraints',
		previous: 'activities',
		next: 'generate'
	},
	generate: {
		percentage: 90,
		label: 'Generate',
		previous: 'constraints',
		next: 'result'
	},
	result: {
		percentage: 100,
		label: 'Result',
		previous: 'generate',
		next: null
	}
};
