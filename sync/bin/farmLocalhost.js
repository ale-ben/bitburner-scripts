export async function main(ns) {
	const hostname = ns.getHostname();
	const serverBlacklist = ["home"];

	if (!serverBlacklist.includes(hostname)) {
		ns.print("Launching farm on " + hostname)
		while (true) {
			if (ns.getServerSecurityLevel(hostname) > ns.getServerMinSecurityLevel(hostname)) {
				await ns.weaken(hostname);
			} else if (ns.getServerMoneyAvailable(hostname) < ns.getServerMaxMoney(hostname)) {
				await ns.grow(hostname);
			} else {
				await ns.hack(hostname);
			}
		}	
	} else {
		ns.print(hostname + " is in server blacklist.\nCannot launch script here.")
	}
}