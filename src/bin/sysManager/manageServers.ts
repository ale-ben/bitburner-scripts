import { NS } from '@ns';

/**
 * If limitsare set to 0, hard limits are used (getPurchasedServerLimit and getPurchasedServerMaxRam)
 */
const config = {
	maxServer: 2, // Number of servers
	minRamExp: 10, // Minimum ram exponent to buy a server
	maxRamExp: 12, // Max ram exponent to buy a server
	prefix: 'pserv', // Prefix for all servers
};

export async function main(ns: NS): Promise<void> {
	ns.disableLog('ALL');

	if (manageServers(ns)) {
		// Required config has been reached
		ns.tail();
		ns.print('INFO: Server upgrade complete. Please edit config or disable script scheduling.');
		ns.tprint('INFO: Server upgrade complete. Please edit config or disable script scheduling.');
	}
	return;
	return;
}

/**
 * Returns the player's balance
 * @param ns The NS instance
 * @returns number: the player's balance
 */
function getBalance(ns: NS): number {
	return ns.getServerMoneyAvailable('home');
}

/**
 * Upgrades the server to the specified ram
 * @param ns
 * @param hostname Hostname of the server
 * @param ramExp Ram exponent
 */
function upgradeServer(ns: NS, hostname: string, ramExp: number) {
	const ram = Math.pow(2, ramExp);
	ns.print('INFO: Upgrading ' + hostname + ' to ' + ns.formatRam(ram));
	ns.killall(hostname);
	ns.deleteServer(hostname);
	ns.purchaseServer(hostname, ram);
}

/**
 * Evaluate the max upgradable level of ram
 * @param ns
 * @param currRamExp Current ram level
 * @param maxRamExp Max ram level
 * @returns
 */
function evaluateUpgradableAmount(ns: NS, currRamExp: number, maxRamExp: number) {
	let ramExp = currRamExp;

	while (getBalance(ns) >= ns.getPurchasedServerCost(Math.pow(2, ramExp + 1)) && ramExp + 1 <= maxRamExp) {
		ramExp++;
	}

	return ramExp;
}

function manageServers(ns: NS): boolean {
	// Max values
	const maxServer = config.maxServer == 0 ? ns.getPurchasedServerLimit() : config.maxServer;
	const maxRamExp = config.maxRamExp == 0 ? Math.log2(ns.getPurchasedServerMaxRam()) : config.maxRamExp;

	const minRam = Math.pow(2, config.minRamExp); // Minimum ram required to buy a server
	let upgradesCompleted = true; // Track wether the required config has been reached or not

	const servers = ns.getPurchasedServers();

	while (servers.length < maxServer) {
		// I still have servers to buy
		const startRam = evaluateUpgradableAmount(ns, minRam, maxRamExp);

		const cost = ns.getPurchasedServerCost(startRam);

		if (getBalance(ns) < cost) {
			// Not enough money to buy server
			upgradesCompleted = false;
			ns.print(
				'DEBUG: Not enough money to purchase server. Missing: ' + ns.formatNumber(cost - getBalance(ns)),
			);
			break;
		}

		const hostname = ns.purchaseServer(config.prefix, startRam);
		ns.print('INFO: Buying new server ' + hostname);
		servers.push(hostname);
	}

	const upgradableServers = servers.filter((server) => ns.getServerMaxRam(server) < Math.pow(2, maxRamExp)); // Server that needs upgrading

	for (const serv of upgradableServers) {
		// servers that need ram upgrade
		const availRamExp = Math.log2(ns.getServerMaxRam(serv));
		const upgradableRam = evaluateUpgradableAmount(ns, availRamExp, maxRamExp);

		if (upgradableRam > availRamExp) {
			// Can afford to upgrade RAM
			upgradeServer(ns, serv, upgradableRam);
			if (upgradableRam !== maxRamExp) upgradesCompleted = false;
		} else {
			// Not enough money to upgrade ram
			upgradesCompleted = false;
			ns.print(
				'DEBUG: Not enough money to upgrade ' +
					serv +
					' to ' +
					ns.formatRam(Math.pow(2, upgradableRam + 1)) +
					'. Missing: ' +
					ns.formatNumber(ns.getPurchasedServerCost(Math.pow(2, availRamExp + 1)) - getBalance(ns)),
			);
			continue;
		}
	}

	return upgradesCompleted;
}
