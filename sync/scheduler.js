async function attack(ns) {
	const fileList = ["/bin/attackNeighbours.js", "/bin/propagateToNeighbours.js", "/bin/farmLocalhost.js", "/bin/launchFarm.js", ];
	await ns.scp(fileList, "nectar-net");
	ns.run("/bin/propagateToNeighbours.js");
	await ns.exec("/bin/propagateToNeighbours.js", "nectar-net");
	await ns.sleep(1000*5);
	ns.run("/bin/launchFarm.js");
	await ns.exec("/bin/farmLocalhost.js", "n00dles", 1, "n00dles");
	await ns.exec("/bin/launchFarm.js", "nectar-net");
}

async function manageNodes(ns) {
	ns.run("/bin/manageHacknetNodes.js");
}

export async function main(ns) {


	ns.disableLog("run");
	ns.disableLog("sleep");
	ns.disableLog("exec");
	ns.disableLog("scp");

	var functionList = [
		{
			name: "attack",
			func: attack,
			interval: 10 // in minutes
		},
		{
			name: "manageNodes",
			func: manageNodes,
			interval: 5 // in minutes
		}
	]

	var counter = 0;

	while (true) {

		for (const func of functionList) {
			if (!func.hasOwnProperty('lastRun') || (counter-func.lastRun>func.interval)){
				ns.print("Running " + func.name);
				if (counter>=1000*60*60*24) func.lastRun = 0;
				else func.lastRun = counter;
				await func.func(ns);
			}
		}

		counter++;

		if (counter>=1000*60*60*24) counter = 0;

		await ns.sleep(1000*60);
	}

}