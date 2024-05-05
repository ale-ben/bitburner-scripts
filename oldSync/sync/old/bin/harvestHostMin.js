async function waitForProgram(ns, hostname, PID) {
	while (PID != 0 && ns.isRunning(PID, hostname)) {
		await ns.sleep(5000);
	}
}

export async function main(ns) {

	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("exec");


	const host = ns.args[0];
	const maxRam = ns.args[1];
	const minSecLev = ns.args[2];
	const maxMoney = ns.args[3];
	const target = ns.args[4];

	const growScript = "/bin/core/grow.js";
	const weakenScript = "/bin/core/weaken.js";
	const hackScript = "/bin/core/hack.js";
	const nThreads = Math.floor(maxRam / 1.75);
	const hackThreads = Math.floor(maxRam / 1.7);

	ns.print("Launching farm on " + target)

	if (nThreads == 0) {
		ns.print("No free threads on " + target)
		return;
	}

	while (true) {
		const currSecLev = ns.getServerSecurityLevel(target);
		const currMoney = ns.getServerMoneyAvailable(target);
		var PID;

		if (currSecLev > minSecLev) {
			ns.print("Weakening1 " + target + "(" + nThreads + ")" + ". Current " + currSecLev + "/" + minSecLev);
			PID = ns.exec(weakenScript, host, nThreads, target);
		} else if (currMoney < maxMoney) {
			if (nThreads > 1) {

				const secMult = Math.trunc(2 / 25); // We know that each grow increases sec by 0.004 and each weaken decreases sec by 0.05.
				var growThreads = Math.trunc((25 * nThreads) / 27);  // grow*0.004-sec*0.05=0; grow+sec=prepThreads
				var secThreads = Math.trunc(growThreads * secMult);

				// Assume weaken takes longer than grow
				if (secThreads == 0) {
					secThreads = 1;
					growThreads = nThreads - 1;
				}

				ns.print("Weakening2 " + target + "(" + secThreads + ")" + ". Current " + currSecLev + "/" + minSecLev);
				PID = ns.exec(weakenScript, host, secThreads, target);
				ns.print("Growing " + target + "(" + growThreads + ")" + ". Current " + (currMoney).toFixed(2) + "/" + maxMoney);
				ns.exec(growScript, host, growThreads, target);
			} else {
				ns.print("Growing " + target + "(1). Current " + (currMoney).toFixed(2) + "/" + maxMoney);
				PID = ns.exec(growScript, host, 1, target);
			}
		} else {
			ns.print("Hacking " + target + "(" + nThreads + ")");
			PID = ns.exec(hackScript, host, hackThreads, target);
		}
		await waitForProgram(ns, host, PID);
	}
}