
const serverBlacklist = ["home"];
export async function main(ns) {

	
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("hasRootAccess");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("getServerNumPortsRequired");
	ns.disableLog("brutessh");
	ns.disableLog("ftpcrack");
	ns.disableLog("relaysmtp");
	ns.disableLog("nuke");
	ns.disableLog("fileExists");
	ns.disableLog("scp");

	await visit(ns, "home", "home");
}

async function visit(ns, hostname, caller) {
	var hosts = ns.scan(hostname);
	for (const host of hosts) {
		if (host != caller && host != hostname && !serverBlacklist.includes(host)) {
			var res = false;
			var rootAccess = ns.hasRootAccess(host);
			if (!rootAccess) {
				res = await attack(ns, host);
			}
			if ((res || rootAccess)) {
				await visit(ns, host, hostname);
			}
		}
	}
}

async function attack(ns, host) {
	ns.print("Trying to attack " + host);
	const levelActual = ns.getHackingLevel();
	const levelNeeded = ns.getServerRequiredHackingLevel(host);
	if (levelActual >= levelNeeded) {
		ns.print("Hacking level requirement met to hack " + host);
		const portsNeeded = ns.getServerNumPortsRequired(host);
		if (portsNeeded <= 3) { // Add new attacks
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
			} while (!ns.hasRootAccess(host));
			ns.print("Succesfully hacked " + host);
			ns.tprint("Succesfully hacked " + host);
		} else {
			ns.print("Not enough open ports on " + host + ". Needed:" + portsNeeded);
		}
	} else {
		ns.print("Hacking level to low to hack " + host + ". Needed:" + levelNeeded + ", current: " + levelActual);
	}
}