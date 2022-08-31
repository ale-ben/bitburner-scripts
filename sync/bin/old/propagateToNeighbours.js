export async function main(ns) {

	ns.disableLog("spawn");
	ns.disableLog("exec");
	ns.disableLog("sleep");
	ns.disableLog("scp");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("scan");

	// Servers in this list will be ignored
	const serverBlacklist = ["home"];
	const fileList = ["/bin/attackNeighbours.js", "/bin/propagateToNeighbours.js"];
	const localhost = ns.getHostname();

	let servers = ns.scan();
	for (const host of servers) {
		const hasRootAccess = await ns.hasRootAccess(host);
		const availableRAM = ns.getServerMaxRam(host);
		if (!serverBlacklist.includes(host) && hasRootAccess && (availableRAM >= 8)) {
			await ns.scp(fileList, host);
			await ns.exec("/bin/propagateToNeighbours.js", host);
			await ns.sleep(1000);
		}
	}

	if (!serverBlacklist.includes(localhost) || localhost == "home") {
		const maxRam = ns.getServerMaxRam(localhost);
		ns.print("Launching attack on " + localhost)
		ns.spawn("/bin/attackNeighbours.js", 1, localhost)
	} else {
		ns.print(localhost + " is in server blacklist.\nCannot launch script here.")
	}
}