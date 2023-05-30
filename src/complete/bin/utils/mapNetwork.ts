import {NS} from "@ns";

type AvailServer = {
	name: string;
	ram: number;
	money: number;
	sec: number;
	batchTime?: number; // in seconds
	moneyPerSec?: number;
};

type NotAvailServer = {
	[key: number]: string[];
};

function analyzeServer(ns : NS, host : string): AvailServer {
	const maxMoney = ns.getServerMaxMoney(host);
	const gainPercent = ns.hackAnalyze(host);
	const secTime = ns.getWeakenTime(host);
	const growTime = ns.getGrowTime(host);
	const hackTime = ns.getHackTime(host);

	// Calculate the money per second we can make on this server with a single batch single thread assuming HWGW hacking takes as much time as the longest between grow, hack, and weaken (https://bitburner.readthedocs.io/en/latest/advancedgameplay/hackingalgorithms.html)
	const batchTime = Math.max(secTime, hackTime, growTime)/1000; // in seconds
	const moneyPerSec = Math.round((maxMoney * gainPercent) /batchTime );

	return {
		name: host,
		ram: ns.getServerMaxRam(host),
		money: maxMoney,
		sec: ns.getServerMinSecurityLevel(host),
		batchTime: batchTime,
		moneyPerSec: moneyPerSec
	};
}

/**
 * Maps the network using a BFS approach and returns an object with available and unavailable servers
 * @param ns
 * @returns
 */
function mapNetwork(ns : NS): {
	avail: AvailServer[];
	notAvail: NotAvailServer;
} {
	const serversToCheck = ["home"];
	const serversChecked: string[] = [];
	const serversAvailable: AvailServer[] = [];
	const serversUnavailable: NotAvailServer = {};

	while (serversToCheck.length > 0) {
		const serverToCheck = serversToCheck.pop();
		// If we're not on a server, skip it
		if (!serverToCheck) 
			continue;
		
		// If we've already checked this server, skip it
		if (serversChecked.find((s) => s === serverToCheck)) 
			continue;
		
		// Add the server to the checked list
		serversChecked.push(serverToCheck);
		// If we have root access, add it to the available list
		if (ns.hasRootAccess(serverToCheck)) 
			serversAvailable.push(analyzeServer(ns, serverToCheck));
		else {
			// If we don't have root access, add it to the unavailable list with the number of ports required
			if (!serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)]) 
				serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)] = [];
			serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)].push(serverToCheck);
		}

		// Get the servers connected to this server
		const results = ns.scan(serverToCheck);

		// Add the servers connected to this server to the list of servers to check if we haven't already checked them
		results.forEach((result) => {
			if (!serversChecked.find((s) => s === result)) 
				serversToCheck.push(result);
			}
		);
	}
	return {avail: serversAvailable, notAvail: serversUnavailable};
}

export function main(ns : NS): void {
	ns.disableLog("ALL");
	const availFile = "/data/availServers.txt";
	const notAvailFile = "/data/unavailServers.txt";

	const res = mapNetwork(ns);
	ns.print("Available servers: " + JSON.stringify(res.avail));
	ns.print("Unavailable servers: " + JSON.stringify(res.notAvail));


	ns.write(availFile, JSON.stringify(res.avail.sort((a,b) => a.name.localeCompare(b.name))), "w");
	ns.write(notAvailFile, JSON.stringify(res.notAvail), "w");
}
