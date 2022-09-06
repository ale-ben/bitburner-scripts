function getBalance(ns) {
	return ns.getServerMoneyAvailable("home");
}

function upgradeServer(ns, hostname, ramExp) {
	ns.killall(hostname);
	ns.deleteServer(hostname);
	ns.purchaseServer(hostname, Math.pow(2, ramExp));
}

export async function main(ns) {

	ns.disableLog("ALL");

	const minRamExp = 10; // Minimum RAM required to buy a server
	const maxServers = ns.getPurchasedServerLimit();
	const serverPrefix = "pserv";
	let servers = ns.getPurchasedServers();
	var upgradesCompleted = true; 


	while (servers.length < maxServers) {
		upgradesCompleted = false;
		if (getBalance(ns) >= ns.getPurchasedServerCost(Math.pow(2, minRamExp))) {
			const hostname = ns.purchaseServer(serverPrefix, Math.pow(2, minRamExp));
			ns.print("INFO: Buying new server " + hostname);
			servers.push(hostname);
		} else {
			ns.print("DEBUG: Not enough money to buy a new server");
			break;
		}
	}

	if(servers.length == maxServers) {
		ns.print("INFO: Max servers reached");
	}

	for (const serv of servers) {
		const availRam = ns.getServerMaxRam(serv);
		const maxRam = ns.getPurchasedServerMaxRam();
		if (availRam < maxRam) {
			upgradesCompleted = false;
			const availPow = Math.log2(availRam);
			const newPow = availPow+1;
			if (getBalance(ns) >= ns.getPurchasedServerCost(Math.pow(2, newPow))) {
				ns.print("INFO: Upgrading " + serv + " to " + (newPow-9) + "TB");
				upgradeServer(ns, serv, newPow);
			} else {
				ns.print("DEBUG: Not enough money to upgrade " + serv);
			}
		}
	}

	if (upgradesCompleted) {
		ns.tail();
		ns.print("INFO: Servers upgraded successfully.");
		ns.tprint("INFO: Servers upgraded successfully.");
	}

}