import { error, type RequestEvent } from '@sveltejs/kit';

export class Security {
	private readonly user?: import('$lib/server/auth').SessionValidationResult['user'];

	constructor(private readonly event: RequestEvent) {
		this.user = event.locals.user;
	}

	isAuthenticated() {
		if (!this.user) {
			error(401);
		}
		return this;
	}

	isStudent() {
		if (!this.user?.type || this.user.type !== 'student') {
			error(403, 'not student');
		}
		return this;
	}

	isTeacher() {
		if (!this.user?.type || this.user.type !== 'teacher') {
			error(403, 'not teacher');
		}
		return this;
	}

	isPrincipal() {
		if (!this.user?.type || this.user.type !== 'principal') {
			error(403, 'not principal');
		}
		return this;
	}

	isSchoolAdmin() {
		if (!this.user?.type || this.user.type !== 'schoolAdmin') {
			error(403, 'not school admin');
		}
		return this;
	}

	getUser() {
		if (!this.user) {
			error(401);
		}
		return this.user;
	}
}
