export async function main(ns) {

	ns.disableLog("spawn");
	ns.disableLog("exec");
	ns.disableLog("sleep");
	ns.disableLog("scp");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("scan");
	
	// Servers in this list will be ignored
	const serverBlacklist = ["home"];
	const fileList = ["/bin/launchFarm.js", "/bin/farmLocalhost.js"];
	const localhost = ns.getHostname();

	let servers = ns.scan();
	for (const host of servers) {
		const hasRootAccess = await ns.hasRootAccess(host);
		const availableRAM = ns.getServerMaxRam(host);
		if (!serverBlacklist.includes(host) && hasRootAccess && (availableRAM >= 8)) {
			await ns.scp(fileList, host);
			await ns.exec("/bin/launchFarm.js", host);
			await ns.sleep(1000);
		}
	}

	if (!serverBlacklist.includes(localhost)) {
		const maxRam = ns.getServerMaxRam(localhost);
		const nThreads = Math.trunc(maxRam / 2.5); //TODO: Update ram cost if farmLocalhost gets modified
		ns.print("Launching farm on " + localhost + " with " + nThreads + " threads.")
		ns.spawn("/bin/farmLocalhost.js", nThreads, localhost)
	} else {
		ns.print(localhost + " is in server blacklist.\nCannot launch script here.")
	}
}