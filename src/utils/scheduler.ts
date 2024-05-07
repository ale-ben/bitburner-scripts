import { NS } from '@ns';

interface scheduleElement {
	path: string;
	name: string;
	interval: number;
	status: boolean;
	lastRun?: number;
}

export async function main(ns: NS) {
	ns.disableLog('run');
	ns.disableLog('sleep');
	ns.disableLog('exec');
	ns.disableLog('scp');

	let schedule: scheduleElement[] = loadSchedule(ns);

	let counter = 0; // Passed minutes since start (or rollover)

	while (true) {
		if (counter % 5 == 0) {
			// Every 5 minutes, reload the schedule
			ns.print('DEBUG: Reloading schedule');
			const newSched = loadSchedule(ns);
			schedule = mergeSchedules(schedule, newSched);
			ns.print(schedule);
			ns.print('INFO: Schedule updated');
		}

		for (const el of schedule) {
			if (el.status && (!el.lastRun || counter - el.lastRun > el.interval || counter < el.lastRun)) {
				// Should run the program
				ns.print('INFO: Running ' + el.name);

				// Rollover for counter > 24 hours
				if (counter >= 60 * 24) {
					el.lastRun = 0;
					ns.print('DEBUG: LastRun rollback');
				} else el.lastRun = counter;

				ns.run(el.path);
			}
		}

		counter++;
		if (counter >= 60 * 24) {
			counter = 0;
			ns.print('DEBUG: Counter rollback');
		} // If counter goes over 24 hours, rollover to 0

		await ns.sleep(1000 * 60); // Sleep 1 minute
	}
}

/**
 * Verify if element is of type scheduleElement
 * @param ns
 * @param element
 * @returns
 */
function isScheduleElement(ns: NS, element: unknown): element is scheduleElement {
	if (element === null || element === undefined) {
		ns.print('Error while parsing element' + element + '. Element is null or undefined');
		return false;
	}

	if (typeof element !== 'object') {
		ns.print('Error while parsing element' + element + '. Element is not an object');
		return false;
	}

	if (!('path' in element)) {
		ns.print('Error while parsing element' + element + '. Element is missing path');
		return false;
	}
	if (typeof element.path !== 'string') {
		ns.print('Error while parsing element' + element + '. path field must be of type string');
		return false;
	}

	if (!('name' in element)) {
		ns.print('Error while parsing element' + element + '. Element is missing name');
		return false;
	}
	if (typeof element.name !== 'string') {
		ns.print('Error while parsing element' + element + '. name field must be of type string');
		return false;
	}

	if (!('interval' in element)) {
		ns.print('Error while parsing element' + element + '. Element is missing interval');
		return false;
	}
	if (typeof element.interval !== 'number') {
		ns.print('Error while parsing element' + element + '. interval field must be of type number');
		return false;
	}

	if (!('status' in element)) {
		ns.print('Error while parsing element' + element + '. Element is missing status');
		return false;
	}
	if (typeof element.status !== 'boolean') {
		ns.print('Error while parsing element' + element + '. status field must be of type boolean');
		return false;
	}

	return true;
}

/**
 * Convert a schedule string read from a file to an array of scheduleElements
 * @param ns
 * @param scheduleStr
 * @returns
 */
function parseScheduleString(ns: NS, scheduleStr: string) {
	const scheduleJson = JSON.parse(scheduleStr);
	const returnArr: scheduleElement[] = [];

	if (!Array.isArray(scheduleJson)) {
		ns.print('Error while parsing scheduler. scheduler is not an array.');
	}

	for (const el of scheduleJson) {
		if (isScheduleElement(ns, el)) {
			returnArr.push(el);
		}
	}

	return returnArr;
}

/**
 * Merges multiple schedules preserving lastRun from baseEl
 * @param baseEl
 * @param newEl
 * @returns
 */
function mergeSchedules(baseEl: scheduleElement[], newEl: scheduleElement[]): scheduleElement[] {
	const returnEl = baseEl;

	for (const el of newEl) {
		const base = returnEl.findIndex((elem) => {
			return elem.name === el.name;
		});

		if (base === -1) {
			// Can't find any element with the same name. push new element
			returnEl.push(el);
			continue;
		}

		// Found a correspondence, overwrite it but keep lastRun
		const lastRun = returnEl[base].lastRun;
		returnEl[base] = {
			lastRun,
			...el,
		};
	}

	return returnEl;
}

/**
 * Load a schedule from file
 * @param ns
 * @returns
 */
function loadSchedule(ns: NS): scheduleElement[] {
	const scheduleStr = ns.read('/config/schedulerData.txt');
	return parseScheduleString(ns, scheduleStr);
}
