
export async function main(ns) {
	const host = ns.args[0];

	ns.tprint("Stats for " + host);

	ns.tprint("Used Ram: " + ns.getServerUsedRam(host) + "/" + ns.getServerMaxRam(host));
	ns.tprint("Security level: " + ns.getServerSecurityLevel(host)+"/"+ns.getServerMinSecurityLevel(host));
	ns.tprint("Money: " + ns.getServerMoneyAvailable(host).toFixed(2)+"/"+ns.getServerMaxMoney(host));
	ns.tprint("Weaken time: " + ns.getWeakenTime(host));
	ns.tprint("Grow time: " + ns.getGrowTime(host));
	ns.tprint("Hack time: " + ns.getHackTime(host));
}