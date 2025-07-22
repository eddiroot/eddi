export const steps = {
	'step-01-times': {
		percentage: 10,
		label: 'Times',
		previous: null,
		next: 'step-02-subjects'
	},
	'step-02-subjects': {
		percentage: 20,
		label: 'Subjects',
		previous: 'step-01-times',
		next: 'step-03-teachers'
	},
	'step-03-teachers': {
		percentage: 30,
		label: 'Teachers',
		previous: 'step-02-subjects',
		next: 'step-04-students'
	},
	'step-04-students': {
		percentage: 40,
		label: 'Students',
		previous: 'step-03-teachers',
		next: 'step-05-activities'
	},
	'step-05-activities': {
		percentage: 50,
		label: 'Activities',
		previous: 'step-04-students',
		next: 'step-06-buildings'
	},
	'step-06-buildings': {
		percentage: 60,
		label: 'Buildings',
		previous: 'step-05-activities',
		next: 'step-07-spaces'
	},
	'step-07-spaces': {
		percentage: 70,
		label: 'Spaces',
		previous: 'step-06-buildings',
		next: 'step-08-rules'
	},
	'step-08-rules': {
		percentage: 80,
		label: 'Rules',
		previous: 'step-07-spaces',
		next: 'step-09-confirm'
	},
	'step-09-confirm': {
		percentage: 90,
		label: 'Confirm',
		previous: 'step-08-rules',
		next: 'step-10-result'
	},
	'step-10-result': {
		percentage: 100,
		label: 'Result',
		previous: 'step-09-confirm',
		next: null
	}
};
