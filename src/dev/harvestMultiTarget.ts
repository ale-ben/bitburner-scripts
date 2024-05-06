import { NS } from '@ns';

interface TargetProfile {
	hostname: string;
	maxMoney: number;
	minSecurity: number;
	weakenGrow: {
		threads: number;
		delay: number;
	};
	grow: {
		threads: number;
		delay: number;
	};
	weakenHack: {
		threads: number;
		delay: number;
	};
	hack: {
		threads: number;
		delay: number;
	};
}

interface ScriptProfile {
	path: string;
	ram: number;
}

interface ScheduleEvent {
	target: string;
	script: ScriptProfile;
	threads: number;
	delay: number;
}

interface ServerProfile {
	hostname: string;
	availRam: number;
	scheduled: ScheduleEvent[];
}

const scripts = {
	grow: {
		path: '/bin/core/delayGrow.js',
		ram: 1.75,
	},
	weaken: {
		path: '/bin/core/delayWeaken.js',
		ram: 1.75,
	},
	hack: {
		path: '/bin/core/delayHack.js',
		ram: 1.7,
	},
};

export async function main(ns: NS) {
	ns.disableLog('ALL');

	// Base parameters
	const weakenPerThread = ns.weakenAnalyze(1, 1);
	const hackThreadReduce = 1;
	const threadDelay = 150; // Ms delay between threads

	let delay = 0.01;

	// Create targets
	const targets = ['joesguns', 'phantasy', 'galactic-cyber'];
	const targetProfiles = targets
		.map((el) => evaluateTarget(ns, el, weakenPerThread, hackThreadReduce, threadDelay))
		.filter((el) => el !== undefined) as TargetProfile[];

	if (targetProfiles.length === 0) {
		ns.print("ERROR: No valid target profile found. Quitting");
		ns.tprint("ERROR: No valid target profile found. Quitting");
		return;
	}

	// Create servers
	const servers = getServerProfiles(ns);
	ns.print('INFO: generated server profiles for ' + servers.length + ' servers.');

	while (true) {
		let targetIndex = 0;
		// Try to schedule repeatedly
		while (scheduleTarget(ns, servers, targetProfiles[targetIndex++], delay)) {
			if (targetIndex % targetProfiles.length == 0) {
				delay += 4 * threadDelay;
				targetIndex = 0;
			}
		}

		ns.print('INFO: Generated ' + servers.reduce((acc, el) => el.scheduled.length + acc, 0) + ' events.');

		// Launch attack
		deploySchedule(ns, servers);

		const sleepTime = 5; // Sleep 5 seconds
		await ns.sleep(1000 * sleepTime);
		delay = Math.max(delay - 1000 * sleepTime, 0.01);
	}

	return;
}

/**
 * Generate a TargetProfile for the specified target
 * @param ns
 * @param target Hostname of the target
 * @param weakenPerThread How much does a single weaken thread reduce security
 * @param hackThreadDivisor Increase this to reduce the number of hack threads generated. Hack threads are evaluated by calculating the threads needed to take max available money on the server and divide them by hackThreadDivisor.
 * @returns TargetProfile
 */
function evaluateTarget(
	ns: NS,
	target: string,
	weakenPerThread: number,
	hackThreadDivisor: number,
	threadDelay: number,
): TargetProfile | undefined {
	ns.print('INFO: Generating profile for ' + target);

	// Check if the target is valid
	if (!ns.serverExists(target) || !ns.hasRootAccess(target) || ns.getServerMaxMoney(target) < 1) {
		ns.tprint(
			'WARN: Skipping invalid target: ' +
				target +
				'. Server exists: ' +
				ns.serverExists(target) +
				', has root access: ' +
				ns.hasRootAccess(target) +
				', has max money: ' +
				ns.getServerMaxMoney(target),
		);
		ns.print(
			'WARN: Skipping invalid target: ' +
				target +
				'. Server exists: ' +
				ns.serverExists(target) +
				', has root access: ' +
				ns.hasRootAccess(target) +
				', has max money: ' +
				ns.getServerMaxMoney(target),
		);
		return;
	}

	const profile: TargetProfile = {
		hostname: target,
		maxMoney: ns.getServerMaxMoney(target),
		minSecurity: ns.getServerMinSecurityLevel(target),
		weakenGrow: {
			threads: 0,
			delay: 0,
		},
		weakenHack: {
			threads: 0,
			delay: 0,
		},
		grow: {
			threads: 0,
			delay: 0,
		},
		hack: {
			threads: 0,
			delay: 0,
		},
	};

	// Generate threads
	profile.hack.threads = Math.floor(
		ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target) / hackThreadDivisor),
	);
	profile.weakenHack.threads = Math.ceil(ns.hackAnalyzeSecurity(profile.hack.threads, target) / weakenPerThread);
	profile.grow.threads = Math.ceil(
		ns.growthAnalyze(target, 1 / (1 - Math.min(0.99, ns.hackAnalyze(target) * profile.hack.threads))),
	);
	profile.weakenGrow.threads = Math.ceil(ns.growthAnalyzeSecurity(profile.grow.threads) / weakenPerThread);

	// Generate delays
	const weakTime = ns.getWeakenTime(target);
	const growTime = ns.getGrowTime(target);
	const hackTime = ns.getHackTime(target);

	// Note that batchdelay is added later
	profile.weakenHack.delay = 0;
	profile.weakenGrow.delay = threadDelay * 2; // Should be weakTime + threadDelay*2 - weakTime;
	profile.grow.delay = weakTime + threadDelay - growTime;
	profile.hack.delay = weakTime - threadDelay - hackTime;

	if (
		ns.getServerMoneyAvailable(target) !== profile.maxMoney ||
		ns.getServerSecurityLevel(target) !== profile.minSecurity
	) {
		ns.print('WARN: Server ' + target + ' is not prepared. Skipping...');
		ns.tprint('WARN: Server ' + target + ' is not prepared. Skipping...');
		return;
	}

	ns.print('DEBUG: Generated profile for target ' + target + '. ' + JSON.stringify(profile));
	return profile;
}

/**
 * Caluclates the available ram considering the scheduled scripts
 * @param ns
 * @param server
 * @returns The available RAM
 */
function getAvailableRam(ns: NS, server: ServerProfile): number {
	let available = ns.getServerMaxRam(server.hostname) - ns.getServerUsedRam(server.hostname);

	for (const el of server.scheduled) {
		// Subtract from available the cost of scheduled scripts
		available -= el.threads * el.script.ram;
	}

	return available;
}

function syncScripts(ns: NS, host: string, override: boolean) {
	if (!ns.fileExists(scripts.grow.path, host) || override) {
		ns.print('INFO - Copying ' + scripts.grow.path + ' to ' + host);
		ns.scp(scripts.grow.path, host, 'home');
	}

	if (!ns.fileExists(scripts.hack.path, host) || override) {
		ns.print('INFO - Copying ' + scripts.hack.path + ' to ' + host);
		ns.scp(scripts.hack.path, host, 'home');
	}

	if (!ns.fileExists(scripts.weaken.path, host) || override) {
		ns.print('INFO - Copying ' + scripts.weaken.path + ' to ' + host);
		ns.scp(scripts.weaken.path, host, 'home');
	}
}

/**
 * Generates the server profiles
 * @param ns
 * @returns
 */
function getServerProfiles(ns: NS): ServerProfile[] {
	const servers = ns.getPurchasedServers();
	const serverProfiles: ServerProfile[] = [];

	for (const server of servers) {
		syncScripts(ns, server, false);
		serverProfiles.push({
			hostname: server,
			availRam: -1,
			scheduled: [],
		});
	}

	return serverProfiles;
}

/**
 * Try to schedule the specified target in the servers
 * @param ns
 * @param servers
 * @param target
 * @param baseDelay
 * @returns
 */
function scheduleTarget(ns: NS, servers: ServerProfile[], target: TargetProfile, baseDelay: number): boolean {
	const toSchedule: ScheduleEvent[] = [
		{
			target: target.hostname,
			script: scripts.weaken,
			threads: target.weakenHack.threads,
			delay: baseDelay + target.weakenHack.delay,
		},
		{
			target: target.hostname,
			script: scripts.weaken,
			threads: target.weakenGrow.threads,
			delay: baseDelay + target.weakenGrow.delay,
		},
		{
			target: target.hostname,
			script: scripts.grow,
			threads: target.grow.threads,
			delay: baseDelay + target.grow.delay,
		},
		{
			target: target.hostname,
			script: scripts.hack,
			threads: target.hack.threads,
			delay: baseDelay + target.hack.delay,
		},
	];

	const totalRAM = Math.ceil(
		toSchedule.reduce((accumulator, event) => accumulator + event.threads * event.script.ram, 0),
	);

	for (const server of servers) {
		// First loop, try to find a server that can host all scripts
		if (getAvailableRam(ns, server) < totalRAM) continue;

		// Found it! Schedule all on the server and return true
		server.scheduled = server.scheduled.concat(toSchedule);
		return true;
	}

	// No single server can host the complete schedule. Can I split it?
	const serversRam = servers.map((server) => getAvailableRam(ns, server));
	const serverSchedule: ScheduleEvent[][] = new Array<Array<ScheduleEvent>>(servers.length);

	for (const schedule of toSchedule) {
		let serverIndex = 0;

		const scheduleRAM = Math.ceil(schedule.script.ram * schedule.threads); // How much ram does this schedule require?

		while (serverIndex < serversRam.length) {
			if (scheduleRAM <= serversRam[serverIndex]) {
				// Found a place to schedule this script. Add it to the array and decrease available ram
				if (serverSchedule[serverIndex] === undefined) serverSchedule[serverIndex] = [];
				serverSchedule[serverIndex].push(schedule);
				serversRam[serverIndex] -= scheduleRAM;
				break;
			} else {
				// This server can't hold it, try the next
				serverIndex++;
			}
		}

		if (serverIndex >= serversRam.length) {
			// If I reach here, it means that I haven't been able to schedule the event on any server
			return false;
		}
	}

	// At this point, everything should be scheduled. Move it to the official schedule and confirm
	for (let i = 0; i < servers.length; i++) {
		const scheduledRam = serverSchedule[i].reduce(
			(accumulator, event) => accumulator + event.threads * event.script.ram,
			0,
		);
		if (getAvailableRam(ns, servers[i]) >= scheduledRam) {
			// Can schedule them
			servers[i].scheduled = servers[i].scheduled.concat(serverSchedule[i]);
		} else {
			// Something went wrong, I should be able to schedule them!!
			ns.tprint(
				'ERROR: Unable to schedule an event on server ' +
					servers[i].hostname +
					'. Something went wrong in scheduling',
			);
			return false;
		}
	}

	// Moved everything to the correct schedule
	return true;
}

function deploySchedule(ns: NS, servers: ServerProfile[]) {
	ns.print('INFO: Deploying schedule');
	for (const [serverIndex, server] of servers.entries()) {
		let sched = server.scheduled.shift();
		let i = 0;
		while (sched !== undefined) {
			const res = ns.exec(
				sched.script.path,
				server.hostname,
				sched.threads,
				sched.target,
				sched.delay,
				serverIndex + '-' + i++,
			);
			if (res === 0) {
				ns.print('ERROR: Unable to schedule ' + JSON.stringify(sched));
			}
			sched = server.scheduled.shift();
		}
	}
}
