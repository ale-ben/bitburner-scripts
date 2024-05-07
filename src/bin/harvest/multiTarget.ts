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
	target: TargetProfile;
	script: ScriptProfile;
	threads: number;
	delay: number;
	pid: number;
	server?: ServerProfile;
}

interface ServerProfile {
	hostname: string;
	availRam: number;
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
	ns.disableLog('exec');
	ns.disableLog('sleep');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('getServerMaxMoney');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('getServerSecurityLevel');

	// Base parameters
	const weakenPerThread = ns.weakenAnalyze(1, 1);
	const hackThreadReduce = 1;
	const threadDelay = 150; // Ms delay between threads

	// Create targets
	const targets = ['joesguns', 'phantasy', 'galactic-cyber'];
	const targetProfiles = targets
		.map((el) => evaluateTarget(ns, el, weakenPerThread, hackThreadReduce, threadDelay))
		.filter((el) => el !== undefined) as TargetProfile[];

	if (targetProfiles.length === 0) {
		ns.print('ERROR: No valid target profile found. Quitting');
		ns.tprint('ERROR: No valid target profile found. Quitting');
		return;
	}

	// Create servers
	const servers = getServerProfiles(ns);
	ns.print('INFO: generated server profiles for ' + servers.length + ' servers.');

	const scheduled: { [key: string]: ScheduleEvent[] } = {};

	while (true) {
		for (const profile of targetProfiles) {
			if (!(profile.hostname in scheduled) || !areRunning(ns, scheduled[profile.hostname])) {
				// Target is not being harvested. HARVEST IT

				let schedule: ScheduleEvent[] | undefined;

				if (
					ns.getServerMoneyAvailable(profile.hostname) !== profile.maxMoney ||
					ns.getServerSecurityLevel(profile.hostname) !== profile.minSecurity
				) {
					// If server is not ready (max money, min sec), schedule prepare
					ns.print('DEBUG: Server ' + profile.hostname + ' is not ready, spawning prepare.');
					schedule = prepareTarget(ns, servers, profile);
				} else {
					// If server is ready, schedule harvest
					schedule = scheduleTarget(ns, servers, profile); // Generate schedule
				}

				if (schedule !== undefined) {
					ns.print('INFO: Spawning schedule for ' + profile.hostname);
					// If schedule has beem generated successfully, deploy it
					scheduled[profile.hostname] = schedule;
					deploySchedule(ns, schedule);
				}
			}
		}

		await ns.sleep(1000);
	}

	return;
}

function areRunning(ns: NS, events: ScheduleEvent[]): boolean {
	return events
		.filter((el) => el.pid !== 0)
		.map((el) => ns.isRunning(el.pid))
		.reduce((acc, isRunning) => acc || isRunning, false);
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
		ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target)*90/100) / hackThreadDivisor, // Try to hack 9% of the total available
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
	server.availRam = ns.getServerMaxRam(server.hostname) - ns.getServerUsedRam(server.hostname);
	return server.availRam;
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
		});
	}

	return serverProfiles;
}

/**
 * Try to schedule the specified target in the servers
 * @param ns
 * @param servers
 * @param target
 * @returns
 */
function scheduleTarget(ns: NS, servers: ServerProfile[], target: TargetProfile): ScheduleEvent[] | undefined {
	const baseDelay = 0.001;

	const toSchedule: ScheduleEvent[] = [
		{
			target,
			pid: 0,
			script: scripts.weaken,
			threads: target.weakenHack.threads,
			delay: baseDelay + target.weakenHack.delay,
		},
		{
			target,
			pid: 0,
			script: scripts.weaken,
			threads: target.weakenGrow.threads,
			delay: baseDelay + target.weakenGrow.delay,
		},
		{
			target,
			pid: 0,
			script: scripts.grow,
			threads: target.grow.threads,
			delay: baseDelay + target.grow.delay,
		},
		{
			target,
			pid: 0,
			script: scripts.hack,
			threads: target.hack.threads,
			delay: baseDelay + target.hack.delay,
		},
	];

	const serversRam = servers.map((server) => getAvailableRam(ns, server));

	for (const schedule of toSchedule) {
		let serverIndex = 0;

		const scheduleRAM = Math.ceil(schedule.script.ram * schedule.threads); // How much ram does this schedule require?

		while (serverIndex < serversRam.length) {
			if (scheduleRAM <= serversRam[serverIndex]) {
				// Found a place to schedule this script. Save the server in the schedule and continue
				schedule.server = servers[serverIndex];
				serversRam[serverIndex] -= scheduleRAM;
				break;
			} else {
				// This server can't hold it, try the next
				serverIndex++;
			}
		}

		if (serverIndex >= serversRam.length) {
			// If I reach here, it means that I haven't been able to schedule the event on any server
			return;
		}
	}

	// Moved everything to the correct schedule
	return toSchedule;
}

/**
 * Schedule scripts needed to prepare a host for HWGW
 * @param ns 
 * @param servers 
 * @param target 
 * @returns 
 */
function prepareTarget(ns: NS, servers: ServerProfile[], target: TargetProfile): ScheduleEvent[] | undefined {
	const currMoney = ns.getServerMoneyAvailable(target.hostname);
	const maxMoney = ns.getServerMaxMoney(target.hostname);

	let maxRam = 0;
	let maxRamIndex = 0;
	
	for (let i = 0; i < servers.length; i++) {
		const avail = getAvailableRam(ns, servers[i]);
		if (avail>maxRam) {
			maxRam = avail;
			maxRamIndex = i;
		}
	}

	const scheduler: ScheduleEvent[] = [];

	if (currMoney !== maxMoney) {
		// Need to grow the server
		ns.print('DEBUG: Growing ' + target.hostname);
		const growThreads = ns.growthAnalyze(target.hostname, maxMoney / Math.max(0.01, currMoney));
		let growRAM = growThreads * scripts.grow.ram;

		if (growRAM <= maxRam) {
			// Can fit the entire grow in a single server! NICE
			const event = {
				target: target,
				script: scripts.grow,
				threads: Math.ceil(growThreads),
				delay: 0.001,
				pid: 0,
				server: servers[maxRamIndex],
			};
			scheduler.push(event);
			if (event.server) event.server.availRam -= growRAM;
		} else {
			let growDivisor = 1;
			while (growRAM > maxRam) {
				growRAM = Math.ceil(growThreads / growDivisor) * scripts.grow.ram;
				growDivisor++;
			}
			const event = {
				target: target,
				script: scripts.grow,
				threads: Math.ceil(growThreads / growDivisor),
				delay: 0.001,
				pid: 0,
				server: servers[maxRamIndex],
			};
			scheduler.push(event);
			if (event.server) event.server.availRam -= growRAM;
		}
		return scheduler;
	}

	const currSec = ns.getServerSecurityLevel(target.hostname);
	const minSec = ns.getServerMinSecurityLevel(target.hostname);
	if (currSec > minSec) {
		// Need to weaken the server
		ns.print('DEBUG: Weakening ' + target.hostname);
		const weakenThreads = (currSec - minSec) / ns.weakenAnalyze(1, 1);

		let weakenRAM = weakenThreads * scripts.weaken.ram;

		if (weakenRAM <= maxRam) {
			// Can fit the entire weaken in a single server! NICE
			const event = {
				target: target,
				script: scripts.weaken,
				threads: Math.ceil(weakenThreads),
				delay: 0.001,
				pid: 0,
				server: servers.find((serv) => serv.availRam >= maxRam),
			};
			scheduler.push(event);
			if (event.server) event.server.availRam -= weakenRAM;
		} else {
			// Try to find the biggest weaken thread count available //TODO: Knowing available ram, can't I just determine it with availRam / weaken.ram? 
			let weakenDivisor = 1;
			while (weakenRAM > maxRam) {
				weakenRAM = Math.ceil(weakenThreads / weakenDivisor) * scripts.weaken.ram;
				weakenDivisor++;
			}
			const event = {
				target: target,
				script: scripts.weaken,
				threads: Math.ceil(weakenThreads / weakenDivisor),
				delay: 0.001,
				pid: 0,
				server: servers.find((serv) => serv.availRam >= maxRam),
			};
			scheduler.push(event);
			if (event.server) event.server.availRam -= weakenRAM;
		}
		return scheduler;
	}

	return;
}

function deploySchedule(ns: NS, schedule: ScheduleEvent[]) {
	ns.print('INFO: Deploying schedule');
	for (const [scheduleIndex, sched] of schedule.entries()) {
		if (sched.server) {
			const res = ns.exec(
				sched.script.path,
				sched.server.hostname,
				sched.threads,
				sched.target.hostname,
				sched.delay,
				scheduleIndex,
			);
			if (res === 0) {
				ns.print('ERROR: Unable to schedule ' + JSON.stringify(sched));
			}
			sched.pid = res;
		} else {
			ns.print('ERROR: Schedule does not have a server. This should not happen');
		}
	}
}