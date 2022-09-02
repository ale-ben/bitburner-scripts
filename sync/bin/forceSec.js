export async function main(ns) {
	const hostname = ns.args[0];

	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMinSecurityLevel");
	ns.disableLog("sleep");
	ns.disableLog("exec");

	ns.print("Launching weaken" + " on " + hostname)

	const availThreads = 50 / 1.75;
	const weakenTime = ns.getWeakenTime(hostname);
	const localhost = ns.getHostname();

	while (ns.getServerSecurityLevel(hostname)>ns.getServerMinSecurityLevel(hostname)) {
			ns.exec("/bin/core/weaken.js", localhost, availThreads, hostname);
			ns.print("Weakening " + hostname + "(" + availThreads + ")");
			await ns.sleep(weakenTime);
	}
}