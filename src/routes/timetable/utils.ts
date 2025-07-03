import { timeToMinutes } from '$lib/utils';

export function generateTimeslots(dayStartHour: number, dayEndHour: number): string[] {
	const slots: string[] = [];
	for (let hour = dayStartHour; hour < dayEndHour; hour++) {
		slots.push(`${hour.toString().padStart(2, '0')}:00`);
		slots.push(`${hour.toString().padStart(2, '0')}:30`);
	}
	return slots;
}

export function getClassPosition(
	dayStartHour: number,
	startTime: string,
	duration: string,
	timeslots: string[]
) {
	const startMinutes = timeToMinutes(startTime);
	const startOfDay = dayStartHour * 60;
	const totalSlots = timeslots.length;
	const slotHeight = 100 / totalSlots;

	const slotIndex = (startMinutes - startOfDay) / 30; // Each slot is 30 minutes
	const topPosition = slotIndex * slotHeight;
	const durationInSlots = timeToMinutes(duration) / 30;
	const height = durationInSlots * slotHeight;

	return {
		top: `calc(${topPosition}% + 2px)`,
		height: `calc(${height}% - 4px)`
	};
}

export function generateSubjectColors(hue: number) {
	return {
		background: `light-dark(hsl(${hue}, 40%, 93%), hsl(${hue}, 50%, 16%))`,
		border: `light-dark(hsl(${hue}, 55%, 58%), hsl(${hue}, 50%, 55%))`,
		text: `light-dark(hsl(${hue}, 65%, 28%), hsl(${hue}, 35%, 87%))`
	};
}
