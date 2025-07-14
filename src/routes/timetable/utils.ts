export function generateTimeslots(dayStartHour: number, dayEndHour: number): string[] {
	const slots: string[] = [];
	for (let hour = dayStartHour; hour < dayEndHour; hour++) {
		slots.push(`${hour.toString().padStart(2, '0')}:00`);
		slots.push(`${hour.toString().padStart(2, '0')}:30`);
	}
	return slots;
}

export function getClassPosition(
	dayStartHour: number = 8,
	startTimestamp: Date,
	endTimestamp: Date,
	timeslots: string[]
) {
	const startMinutes = startTimestamp.getHours() * 60 + startTimestamp.getMinutes();
	const startOfDay = dayStartHour * 60;
	const totalSlots = timeslots.length;
	const slotHeight = 100 / totalSlots;

	const slotIndex = (startMinutes - startOfDay) / 30;
	const topPosition = slotIndex * slotHeight;
	const durationInMinutes = (endTimestamp.getTime() - startTimestamp.getTime()) / 60000;
	const durationInSlots = durationInMinutes / 30;
	const height = durationInSlots * slotHeight;

	return {
		top: `calc(${topPosition}% + 2px)`,
		height: `calc(${height}% - 4px)`
	};
}

export function generateSubjectColors(hue: number) {
	return {
		background: `light-dark(hsl(${hue}, 40%, 93%), hsl(${hue}, 50%, 16%))`,
		borderTop: `light-dark(hsl(${hue}, 55%, 58%), hsl(${hue}, 50%, 55%))`,
		borderAround: `light-dark(hsl(${hue}, 55%, 58%, 0.5), hsl(${hue}, 50%, 55%, 0.5))`,
		text: `light-dark(hsl(${hue}, 65%, 28%), hsl(${hue}, 35%, 87%))`
	};
}
