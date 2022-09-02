
const serverBlacklist = ["home"];
const scriptName = "/bin/harvestHostMin.js";
const fileList = ["/bin/core/grow.js", "/bin/core/weaken.js", "/bin/core/hack.js", "/bin/harvestHostMin.js"];
var target;
var scriptSize;

export async function main(ns) {	
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");

	scriptSize = ns.getScriptRam(scriptName);
	target = ns.args[0];

	await visit(ns, "home", "home");
}

async function visit(ns, hostname, caller) {
	var hosts = ns.scan(hostname);
	for (const host of hosts) {
		if (host != caller && host != hostname && !serverBlacklist.includes(host)) {
			if (ns.hasRootAccess(host)) {
				await harvest(ns, host);
				await visit(ns, host, hostname);
			}
		}
	}
}

async function harvest(ns, host) {
	ns.print("Starting Harvest on " + host);
	await ns.scp(fileList, host);
	const maxRam = ns.getServerMaxRam(host)-scriptSize;
	const minSecLev = ns.getServerMinSecurityLevel(host);
	const maxGrow = ns.getServerMaxMoney(host);
	const weakenTime = ns.getWeakenTime(host);
	const hackTime = ns.getHackTime(host);

	if (ns.isRunning(scriptName,host, host, maxRam, minSecLev, maxGrow, weakenTime, hackTime, target)) {
		ns.print("Killing script in " + host);
		ns.kill(scriptName,host, host, maxRam, minSecLev, maxGrow, weakenTime, hackTime, target);
	}
	ns.exec(scriptName,host, 1, host, maxRam, minSecLev, maxGrow, weakenTime, hackTime, target);
}