async function attack(ns) {
	ns.run("/bin/centralizedAttack.js");//TODO: Launch harvest if new nodes
}

async function manageNodes(ns) {
	ns.run("/bin/manageHacknetNodes.js");
}

async function harvest(ns){
	ns.run("/bin/centralizedLaunchHarvest.js", 1,  "n00dles");
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
		},
		{
			name: "harvest",
			func: harvest,
			interval: 10 // in minutes
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