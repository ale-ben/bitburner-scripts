export async function main(ns) {
	const localhost = ns.args[0];
	
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
}