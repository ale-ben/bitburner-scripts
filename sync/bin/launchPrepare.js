
const serverBlacklist = ["home"];
const scriptName = "/bin/prepareHost.js";
const fileList = ["/bin/core/grow.js", "/bin/core/weaken.js", "/bin/core/hack.js", scriptName];
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
				await prepare(ns, host);
				await visit(ns, host, hostname);
			}
		}
	}
}

async function prepare(ns, host) {
	ns.print("Starting prepare on " + host);
	await ns.scp(fileList, host);
	const maxRam = ns.getServerMaxRam(host)-scriptSize;
	const minSecLev = ns.getServerMinSecurityLevel(target); // TODO: Convertire in un obj da passare come arg
	const maxGrow = ns.getServerMaxMoney(target);

	ns.killall(host, false);
	ns.exec(scriptName,host, 1, host, maxRam, minSecLev, maxGrow, target);
}