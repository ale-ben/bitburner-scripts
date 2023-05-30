
const serverBlacklist = ["home"];

export async function main(ns) {


	ns.disableLog("scan");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("scp");
	ns.disableLog("exec");

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
	const maxRam = ns.getServerMaxRam(host);
	const nThreads = Math.trunc(maxRam / 2.4); //TODO: Update ram cost if farmLocalhost gets modified
	if (nThreads > 0) {
		const fileList = ["/bin/old/farmLocalhost.js"];
		await ns.scp(fileList, host);
		ns.print("Launching farm on " + host + " with " + nThreads + " threads.")
		await ns.exec("/bin/old/farmLocalhost.js", host, nThreads, host)
	} else ns.print("Not enough ram to launch farm on " + host);
	
}