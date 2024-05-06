import { NS } from '@ns';

export async function main(ns: NS) {
	ns.disableLog('ALL');

	const targets = ['joesguns', 'phantasy', 'galactic-cyber'];

	const servers = ns.getPurchasedServers();

	servers.forEach((server) => syncScripts(ns, server, false));

	ns.print("INFO: Starting grow cycle");
	for (const target of targets) {
		// Grow loop
		const currMoney = ns.getServerMoneyAvailable(target);
		const maxMoney = ns.getServerMaxMoney(target);

		if (currMoney !== maxMoney) await grow(ns, servers, target);
	}

	ns.print("INFO: Starting weaken cycle");
	for (const target of targets) {
		// Weaken loop
		const currSec = ns.getServerSecurityLevel(target);
		const minSec = ns.getServerMinSecurityLevel(target);

		if (currSec !== minSec) await weaken(ns, servers, target);
	}

	return;
}

function syncScripts(ns: NS, host: string, override: boolean) {
	if (!ns.fileExists('/bin/core/delayGrow.js', host) || override) {
		ns.print('INFO - Copying ' + '/bin/core/delayGrow.js' + ' to ' + host);
		ns.scp('/bin/core/delayGrow.js', host, 'home');
	}

	if (!ns.fileExists('/bin/core/delayWeaken.js', host) || override) {
		ns.print('INFO - Copying ' + '/bin/core/delayWeaken.js' + ' to ' + host);
		ns.scp('/bin/core/delayWeaken.js', host, 'home');
	}
}

async function grow(ns: NS, servers: string[], target: string): Promise<void> {
	let currMoney = ns.getServerMoneyAvailable(target);
	const maxMoney = ns.getServerMaxMoney(target);

	while (currMoney < maxMoney) {
		ns.print('Generating growth plan for ' + target);
		const growThreads = ns.growthAnalyze(target, maxMoney / Math.max(0.01, currMoney));

		let serverIndex = 0;
		let divisor = 1;
		let res = 0;

		while (res === 0) {
			res = ns.exec(
				'/bin/core/delayGrow.js',
				servers[serverIndex],
				Math.ceil(growThreads / divisor),
				target,
				0.01,
				Math.random() * 1000,
			);
			if (res === 0) {
				serverIndex++;
				if (serverIndex === servers.length) {
					serverIndex = 0;
					divisor++;
				}
			}
		}

		if (divisor === 1) {
			ns.print("INFO: Launched grow on a single server for " + target + ". Monitoring should not be needed");
			return;
		} else {
			ns.print("DEBUG: Launched grow on multiple servers for " + target + ". Monitoring is needed");
		}

		while (ns.isRunning(res)) {
			await ns.sleep(1000 * 5);
		}

		currMoney = ns.getServerMoneyAvailable(target);
	}
	return;
}

async function weaken(ns: NS, servers: string[], target: string): Promise<void> {
	const weakenPerThread = ns.weakenAnalyze(1, 1);

	let currSec = ns.getServerSecurityLevel(target);
	const minSec = ns.getServerMinSecurityLevel(target);

	while (currSec > minSec) {
		ns.print('Generating weaken plan for ' + target);
		const weaken = (currSec-minSec)/weakenPerThread;

		let serverIndex = 0;
		let divisor = 1;
		let res = 0;

		while (res === 0) {
			res = ns.exec(
				'/bin/core/delayWeaken.js',
				servers[serverIndex],
				Math.ceil(weaken / divisor),
				target,
				0.01,
				Math.random() * 1000,
			);
			if (res === 0) {
				serverIndex++;
				if (serverIndex === servers.length) {
					serverIndex = 0;
					divisor++;
				}
			}
		}

		if (divisor === 1) {
			ns.print("INFO: Launched weaken on a single server for " + target + ". Monitoring should not be needed");
			return;
		} else {
			ns.print("DEBUG: Launched weaken on multiple servers for " + target + ". Monitoring is needed");
		}

		while (ns.isRunning(res)) {
			await ns.sleep(1000 * 5);
		}

		currSec = ns.getServerSecurityLevel(target);
	}
	return;
}
