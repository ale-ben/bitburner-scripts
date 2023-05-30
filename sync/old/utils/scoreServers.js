function scoreServer(stats) {
	const weights = {
		"sec": -0.001,
		"grow": 0.000001,
		"secTime": -0.003,
		"hackTime": -0.003, //TODO: Normalizzare tutti i valori
		"growth": 0.005, //TODO: Aggiungere soldiTotali/soldiPerHack
		"moneyPerSecFullCycle" : 0.8,
		"threadsPerFullHack" : 0.75,
	};
	stats.score = 0

	for (const key in weights) {
		stats.score += weights[key] * stats[key];
	}

	return stats
}

function analyzeServer(ns, host) {
	var stats = {
		"hostname": host,
		"ram": ns.getServerMaxRam(host),
		"sec": ns.getServerMinSecurityLevel(host),
		"grow": ns.getServerMaxMoney(host),
		"secTime": ns.getWeakenTime(host),
		"growTime": ns.getGrowTime(host),
		"hackTime": ns.getHackTime(host),
		"growth": ns.getServerGrowth(host),
		"gainPercent": ns.hackAnalyze(host),
		"requiredLevel": ns.getServerRequiredHackingLevel(host)
	};
	stats.moneyPerHack = stats.grow * stats.gainPercent;
	stats.moneyPerSec = stats.moneyPerHack / (stats.hackTime / 1000);
	stats.moneyPerSecFullCycle = stats.moneyPerHack / (Math.max(stats.secTime, stats.hackTime, stats.growTime) / 1000);
	stats.threadsPerFullHack = 1/stats.gainPercent;
	return scoreServer(stats);
}

function visit(ns, hostname, caller) {
	var hosts = ns.scan(hostname);
	for (const host of hosts) {
		if (host != caller && host != hostname && !serverBlacklist.includes(host)) {
			if (ns.hasRootAccess(host)) {
				const res = analyzeServer(ns, host);
				if (res.grow != 0) serverStats.push(res);
				visit(ns, host, hostname);
			}
		}
	}
}

var serverStats = [];
const serverBlacklist = ["home"];
const outFile = "/data/serverStats.txt";

export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");

	serverStats = [];

	visit(ns, "home", "home");

	serverStats.sort((a, b) => b.moneyPerSecFullCycle - a.moneyPerSecFullCycle);
	ns.tprint(serverStats);
	ns.write(outFile, JSON.stringify(serverStats), "w");
}

