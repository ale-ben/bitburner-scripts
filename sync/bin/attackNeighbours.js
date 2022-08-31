export async function main(ns) {

	ns.disableLog("getHackingLevel");
	ns.disableLog("sleep");
	ns.disableLog("scan");

	// Servers in this list will be ignored
	const serverBlacklist = ["home"];
	const localhost = ns.getHostname();
	const levelActual = ns.getHackingLevel();

	let servers = ns.scan();
	for (const host of servers) {
		const hasRootAccess = ns.hasRootAccess(host);
		if (!serverBlacklist.includes(host) && !hasRootAccess) {
			ns.print("Trying to attack " + host);
			const levelNeeded = ns.getServerRequiredHackingLevel(host);
			if (levelActual >= levelNeeded) {
				ns.print("Hacking level requirement met to hack " + host + ". Needed:" + levelNeeded + ", current: " + levelActual);
				const portsNeeded = ns.getServerNumPortsRequired(host);
				if (portsNeeded <= 2) { // Add new attacks
					if (portsNeeded >= 1) {
						await ns.brutessh(host);
						ns.print("SSH port opened on host " + host);
					}
					if (portsNeeded >= 2) {
						await ns.ftpcrack(host);
						ns.print("FTP port opened on host " + host);
					}
					if (portsNeeded >= 3) {
						await ns.relaysmtp(host);
						ns.print("SMTP port opened on host " + host);
					}
					do {
						ns.print("Attempting to get root access on " + host);
						await ns.nuke(host);
						await ns.sleep(1000);
					} while(!ns.hasRootAccess(host));
					ns.print("Succesfully hacked " + host);
					ns.tprint("Succesfully hacked " + host);
				} else {
					ns.print("Not enough open ports on " + host + ". Needed:" + portsNeeded);
					ns.tprint("Not enough open ports on " + host + ". Needed:" + portsNeeded);
				}
			} else {
				ns.print("Hacking level to low to hack " + host + ". Needed:" + levelNeeded);
				ns.tprint("Hacking level to low to hack " + host + ". Needed:" + levelNeeded);
			}
		} else {
			if (hasRootAccess) ns.print("Ignoring " + host + ", root access already obtained.");
			else ns.print("Ignoring " + host + ", server blacklist.");
		}
	}
}