export async function main(ns) {
	const hostname = ns.args[0];

	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	ns.disableLog("exec");

	ns.print("Launching grow" + " on " + hostname)

	const availThreads = 50 / 1.75;
	const growThreads = Math.trunc((25 * availThreads) / 27);
	const secThreads = Math.trunc(availThreads - growThreads);
	const weakenTime = ns.getWeakenTime(hostname);
	const growTime = ns.getGrowTime(hostname);
	const localhost = ns.getHostname();

	while (ns.getServerMaxMoney(hostname)>ns.getServerMoneyAvailable(hostname)) {
		if (weakenTime < growTime) {
			ns.exec("/bin/core/grow.js", localhost, growThreads, hostname);
			ns.print("Growing " + hostname + "(" + growThreads + ")");
			await ns.sleep((growTime - weakenTime) + 5);
			ns.exec("/bin/core/weaken.js", localhost, secThreads, hostname);
			ns.print("Weakening " + hostname + "(" + secThreads + ")");
			await ns.sleep(weakenTime);
		} else {
			ns.exec("/bin/core/weaken.js", localhost, secThreads, hostname);
			ns.print("Weakening " + hostname + "(" + secThreads + ")");
			ns.exec("/bin/core/grow.js", localhost, growThreads, hostname);
			ns.print("Growing " + hostname + "(" + growThreads + ")");
			await ns.sleep(growTime);
		}
	}
}