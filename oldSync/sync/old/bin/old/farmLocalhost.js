export async function main(ns) {

	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");

	const localhost = ns.args[0];

	ns.print("Launching farm on " + localhost)
	while (true) {
		
		if (ns.getServerSecurityLevel(localhost) > ns.getServerMinSecurityLevel(localhost)) {
			await ns.weaken(localhost);
		} else if (ns.getServerMoneyAvailable(localhost) < ns.getServerMaxMoney(localhost)) {
			await ns.grow(localhost);
		} else {
			await ns.hack(localhost);
		}
	}
}