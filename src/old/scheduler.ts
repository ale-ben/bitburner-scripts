import { NS } from '@ns';

async function attack(ns: NS) {
	ns.run('/bin/centralizedAttack.js'); //TODO: Launch harvest if new nodes
	ns.run('/bin/utils/mapNetwork.js');
}

async function manageNodes(ns: NS) {
	ns.run('/bin/manager/manageHacknetNodes.js');
}

async function harvest(ns: NS) {
	ns.run('/bin/centralizedLaunchHarvest.js', 1, 'foodnstuff');
}

async function manageServers(ns: NS) {
	ns.run('/bin/manager/manageServers.js');
}

type Event = {
	name: string;
	func: (ns: NS) => Promise<void>;
	status: boolean;
	interval: number; // in minutes
	lastRun?: number;
};

export async function main(ns: NS): Promise<void> {
	ns.disableLog('run');
	ns.disableLog('sleep');
	ns.disableLog('exec');
	ns.disableLog('scp');

	const functionList: Event[] = [
		{
			name: 'attack',
			func: attack,
			status: false,
			interval: 10,
		},
		{
			name: 'manageNodes',
			func: manageNodes,
			status: false,
			interval: 5, // in minutes
		},
		{
			name: 'harvest',
			func: harvest,
			status: false,
			interval: 10, // in minutes
		},
		{
			name: 'manageServers',
			func: manageServers,
			status: false,
			interval: 5, // in minutes
		},
	];

	let counter = 0;

	while (true) {
		for (const func of functionList) {
			if (func.status && (!func['lastRun'] || counter - func.lastRun > func.interval)) {
				ns.print('Running ' + func.name);
				if (counter >= 1000 * 60 * 60 * 24) func.lastRun = 0;
				else func.lastRun = counter;
				await func.func(ns);
			}
		}

		counter++;

		if (counter >= 1000 * 60 * 60 * 24) counter = 0;

		await ns.sleep(1000 * 60);
	}
}
