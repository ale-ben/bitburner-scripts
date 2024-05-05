import { NS } from '@ns';

const serverBlacklist = ['home'];
let availHacks = 0;

export async function main(ns: NS) {
	ns.disableLog('sleep');
	ns.disableLog('scan');
	ns.disableLog('hasRootAccess');
	ns.disableLog('getHackingLevel');
	ns.disableLog('getServerRequiredHackingLevel');
	ns.disableLog('getServerNumPortsRequired');
	ns.disableLog('brutessh');
	ns.disableLog('ftpcrack');
	ns.disableLog('relaysmtp');
	ns.disableLog('nuke');
	ns.disableLog('fileExists');
	ns.disableLog('scp');

	detectAvailableHacks(ns);
	visit(ns, 'home', '');
}

/**
 * Detects installed attacks and increases counter
 * @param ns
 */
function detectAvailableHacks(ns: NS) {
	if (ns.fileExists('brutessh.exe')) availHacks++;
	if (ns.fileExists('ftpcrack.exe')) availHacks++;
	if (ns.fileExists('relaysmtp.exe')) availHacks++;
	if (ns.fileExists('httpworm.exe')) availHacks++;
	if (ns.fileExists('sqlinject.exe')) availHacks++;
}

/**
 * Attacks a specific host with all available attacks. Then nukes it
 * @param ns
 * @param host
 */
function attack(ns: NS, host: string) {
	let missing = ns.getServerNumPortsRequired(host);

	if (missing > 0 && ns.fileExists('brutessh.exe')) {
		ns.brutessh(host);
		missing--;
	}
	if (missing > 0 && ns.fileExists('ftpcrack.exe')) {
		ns.ftpcrack(host);
		missing--;
	}
	if (missing > 0 && ns.fileExists('relaysmtp.exe')) {
		ns.relaysmtp(host);
		missing--;
	}
	if (missing > 0 && ns.fileExists('httpworm.exe')) {
		ns.httpworm(host);
		missing--;
	}
	if (missing > 0 && ns.fileExists('sqlinject.exe')) {
		ns.sqlinject(host);
		missing--;
	}

	if (missing <= 0) {
		ns.print('DEBUG: Ports opened. Attempting Nuke at ' + host);
		ns.nuke(host);
		// TODO: Backdoor
	}
}

/**
 * Visits in dfs the neighbors
 * @param ns
 * @param host
 * @param caller
 */
function visit(ns: NS, host: string, caller: string) {
	const neighbors = ns.scan(host);
	const filteredNeighbors = neighbors.filter((neighbor) => {
		return (
			!(neighbor in serverBlacklist) && neighbor !== host && neighbor !== caller && !neighbor.startsWith('pserv')
		);
	});

	for (const neighbor of filteredNeighbors) {
		if (
			!ns.hasRootAccess(neighbor) &&
			ns.getServerNumPortsRequired(neighbor) <= availHacks &&
			ns.getServerRequiredHackingLevel(neighbor) <= ns.getHackingLevel()
		) {
			// Attack time
			attack(ns, neighbor);

			if (ns.hasRootAccess(neighbor)) {
				ns.print('INFO: Succesfully gained root access on ' + neighbor);
				ns.tprint('INFO: Succesfully gained root access on ' + neighbor);
			} else {
				ns.print('WARN: Failed gained root access on ' + neighbor);
			}
		}

		visit(ns, neighbor, host);
	}
}
