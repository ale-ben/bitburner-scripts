function scoreServer(stats) {
	const weights = {
		"sec": -0.001,
		"grow": 0.000001,
		"secTime": -0.003,
		"hackTime": -0.003,
		"growth": 0.005,
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
		"requiredLevel": ns.getServerRequiredHackingLevel(host)
	};
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

	visit(ns, "home", "home");

	serverStats.sort((a, b) => b.score - a.score);
	ns.tprint(serverStats);
	ns.write(outFile, JSON.stringify(serverStats), "w");
}

