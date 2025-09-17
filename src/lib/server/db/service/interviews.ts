import { and, count, eq, inArray } from 'drizzle-orm';
import { userTypeEnum, yearLevelEnum } from '../../../enums';
import { db } from '../index';
import { interviewBookings, interviewConfigs, interviewSlots } from '../schema/interviews';
import { subject, subjectOffering, subjectOfferingClass } from '../schema/subjects';
import { user, userSubjectOfferingClass } from '../schema/user';

export const InterviewService = {
	async getConfigBySchoolId(schoolId: number) {
		const [config] = await db
			.select()
			.from(interviewConfigs)
			.where(eq(interviewConfigs.schoolId, schoolId));
		return config || null;
	},

	async createOrUpdateConfig(
		schoolId: number,
		data: Partial<typeof interviewConfigs.$inferInsert>
	) {
		const existing = await this.getConfigBySchoolId(schoolId);
		if (existing) {
			// Clear existing slots when updating configuration
			await this.clearSlotsByConfigId(existing.id);
			await db
				.update(interviewConfigs)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(interviewConfigs.id, existing.id));
			return await this.getConfigBySchoolId(schoolId);
		} else {
			const [created] = await db
				.insert(interviewConfigs)
				.values({ schoolId, ...data })
				.returning();
			return created;
		}
	},

	async clearSlotsByConfigId(configId: string) {
		return await db.delete(interviewSlots).where(eq(interviewSlots.configId, configId));
	},

	async activateConfig(schoolId: number) {
		const config = await this.getConfigBySchoolId(schoolId);
		if (!config) throw new Error('No config found');
		await db
			.update(interviewConfigs)
			.set({ isActive: true, updatedAt: new Date() })
			.where(eq(interviewConfigs.id, config.id));
		// Auto-assign: generate slots if needed
		if (
			config.autoAssign &&
			config.interviewDates &&
			config.deliveryModes &&
			config.dateTimeRanges
		) {
			// Generate slots for all teachers (implementation omitted for brevity)
			// ...
		}
		return await this.getConfigBySchoolId(schoolId);
	},

	async getSlotsByConfig(configId: string) {
		return await db.select().from(interviewSlots).where(eq(interviewSlots.configId, configId));
	},

	/**
	 * Create slots for teachers/classes.
	 * If classIds is null, create slots for teacher only (teacher-based).
	 * If classIds is array, split slots among classes (subject-based).
	 */
	async createSlots(
		configId: string,
		teacherId: string,
		classId: string | null,
		slots: { date: string; start: string; end: string }[],
		duration: number,
		deliveryModes: string[]
	) {
		// Use correct schema field names: startTime, endTime, deliveryMode (single string)
		const slotRecords = slots.map((slot) => ({
			configId,
			teacherId,
			classId: classId ? parseInt(classId) : null,
			date: slot.date,
			startTime: slot.start,
			endTime: slot.end,
			duration,
			deliveryMode: deliveryModes[0], // Assuming one mode for now
			status: 'available',
			createdAt: new Date(),
			updatedAt: new Date()
		}));
		await db.insert(interviewSlots).values(slotRecords);
	},
	/**
	 * Get teachers by their IDs
	 */
	async getTeachersByIds(teacherIds: string[]) {
		if (teacherIds.length === 0) return [];
		return await db
			.select({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email
			})
			.from(user)
			.where(inArray(user.id, teacherIds));
	},

	/**
	 * Get all teachers in a school who teach subjects in the given year levels.
	 */
	async getTeachersByYearLevels(schoolId: number, yearLevels: string[] | null) {
		// Use enum for teacher type
		const teacherType = userTypeEnum.teacher;
		const whereClauses = [eq(user.type, teacherType), eq(user.schoolId, schoolId)];
		if (yearLevels && yearLevels.length > 0) {
			// Cast string array to yearLevelEnum array for type compatibility
			whereClauses.push(
				inArray(
					subject.yearLevel,
					yearLevels as (typeof yearLevelEnum)[keyof typeof yearLevelEnum][]
				)
			);
		}
		return await db
			.selectDistinct({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email
			})
			.from(user)
			.innerJoin(userSubjectOfferingClass, eq(userSubjectOfferingClass.userId, user.id))
			.innerJoin(
				subjectOfferingClass,
				eq(subjectOfferingClass.id, userSubjectOfferingClass.subOffClassId)
			)
			.innerJoin(subjectOffering, eq(subjectOffering.id, subjectOfferingClass.subOfferingId))
			.innerJoin(subject, eq(subject.id, subjectOffering.subjectId))
			.where(and(...whereClauses));
	},

	/**
	 * For a teacher, get all their classes in the selected year levels, with student counts.
	 */
	async getTeacherClassesWithStats(teacherId: string, yearLevels: string[]) {
		// Get classes taught by teacher in selected year levels
		const whereClauses = [eq(userSubjectOfferingClass.userId, teacherId)];
		if (yearLevels && yearLevels.length > 0) {
			// Cast string array to yearLevelEnum array for type compatibility
			whereClauses.push(
				inArray(
					subject.yearLevel,
					yearLevels as (typeof yearLevelEnum)[keyof typeof yearLevelEnum][]
				)
			);
		}
		const classes = await db
			.select({
				id: subjectOfferingClass.id,
				name: subjectOfferingClass.name
			})
			.from(userSubjectOfferingClass)
			.innerJoin(
				subjectOfferingClass,
				eq(subjectOfferingClass.id, userSubjectOfferingClass.subOffClassId)
			)
			.innerJoin(subjectOffering, eq(subjectOffering.id, subjectOfferingClass.subOfferingId))
			.innerJoin(subject, eq(subject.id, subjectOffering.subjectId))
			.where(and(...whereClauses));

		// For each class, count students
		const classesWithStats = [];
		for (const cls of classes) {
			const studentCount = await db
				.select({ count: count() })
				.from(userSubjectOfferingClass)
				.innerJoin(user, eq(user.id, userSubjectOfferingClass.userId))
				.where(
					and(
						eq(userSubjectOfferingClass.subOffClassId, cls.id),
						eq(user.type, userTypeEnum.student)
					)
				);
			classesWithStats.push({
				...cls,
				studentCount: studentCount[0]?.count || 0
			});
		}
		return classesWithStats;
	},

	async getSchoolYearLevels(schoolId: number) {
		// Get all year levels for subjects in this school
		const yearLevels = await db
			.selectDistinct({ yearLevel: subject.yearLevel })
			.from(subject)
			.where(eq(subject.schoolId, schoolId));
		return yearLevels.map((yl) => ({ value: yl.yearLevel, label: `Year ${yl.yearLevel}` }));
	},

	async deleteSlot(slotId: string, teacherId: string, configId: string) {
		return await db
			.delete(interviewSlots)
			.where(
				and(
					eq(interviewSlots.id, slotId),
					eq(interviewSlots.teacherId, teacherId),
					eq(interviewSlots.configId, configId)
				)
			);
	},

	async deleteSlotsByDates(configId: string, dates: string[]) {
		return await db
			.delete(interviewSlots)
			.where(and(eq(interviewSlots.configId, configId), inArray(interviewSlots.date, dates)));
	},

	async updateSlotStatus(slotId: string, teacherId: string, status: 'available' | 'blocked') {
		return await db
			.update(interviewSlots)
			.set({ status })
			.where(and(eq(interviewSlots.id, slotId), eq(interviewSlots.teacherId, teacherId)));
	},

	// Bookings
	async getBookingsBySlot(slotId: string) {
		return await db.select().from(interviewBookings).where(eq(interviewBookings.slotId, slotId));
	},

	async createBooking(slotId: string, parentId: string, studentId: string) {
		// Create a booking for a slot
		return await db.insert(interviewBookings).values({
			slotId,
			parentId,
			studentId,
			status: 'booked',
			createdAt: new Date(),
			updatedAt: new Date()
		});
	},

	async cancelBooking(bookingId: string) {
		// Cancel a booking
		return await db
			.update(interviewBookings)
			.set({ status: 'cancelled', updatedAt: new Date() })
			.where(eq(interviewBookings.id, bookingId));
	},

	async getBookingsByParent(parentId: string) {
		return await db
			.select()
			.from(interviewBookings)
			.where(eq(interviewBookings.parentId, parentId));
	},

	async getBookingsByStudent(studentId: string) {
		return await db
			.select()
			.from(interviewBookings)
			.where(eq(interviewBookings.studentId, studentId));
	},

	async hasActiveInterviewSlots(teacherId: string) {
		// Check if teacher has any slots in an active configuration
		const activeConfig = await db
			.select()
			.from(interviewConfigs)
			.where(eq(interviewConfigs.isActive, true));

		if (activeConfig.length === 0) return false;

		const slots = await db
			.select({ id: interviewSlots.id })
			.from(interviewSlots)
			.where(
				and(
					eq(interviewSlots.teacherId, teacherId),
					eq(interviewSlots.configId, activeConfig[0].id)
				)
			)
			.limit(1);

		return slots.length > 0;
	}
};
