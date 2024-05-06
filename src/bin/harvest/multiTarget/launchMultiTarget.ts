import { NS } from "@ns";


export async function main(ns: NS) {
	// Launch the prepare script
	ns.print("INFO: Spawning prepare script");
	const res = ns.run("/dev/prepareMultiTarget.js");
	if (res === 0) {
		ns.print("ERROR: Unable to spawn prepare script.");
		ns.tprint("ERROR: Unable to spawn prepare script.");
		return;
	}
	while (ns.isRunning(res)) {
		await ns.sleep(1000*5);
	}

	// Launch the harvest script
	ns.print("INFO: Spawning harvest script");
	const res1 = ns.run("/dev/harvestMultiTarget.js");
	if (res1 === 0) {
		ns.print("ERROR: Unable to spawn harvest script.");
		ns.tprint("ERROR: Unable to spawn harvest script.");
		return;
	}
	return;
}