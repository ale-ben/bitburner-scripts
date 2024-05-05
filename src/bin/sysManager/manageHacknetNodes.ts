import { Hacknet, NS } from '@ns';

const config = {
	nodes: 16,
	level: {
		req: 100,
		block: 5,
	},
	ram: {
		req: 64,
		block: 1,
	},
	cores: {
		req: 8,
		block: 1,
	},
};

export async function main(ns: NS): Promise<void> {
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('sleep');

	if (nodesUpgrade(ns)) {
		// Required config has been reached
		ns.tail();
		ns.print('INFO: Hacknet nodes upgrade complete. Please edit config or disable script scheduling.');
		ns.tprint('INFO: Hacknet nodes upgrade complete. Please edit config or disable script scheduling.');
	}
	return;
}

/**
 * Returns the player's balance
 * @param ns The NS instance
 * @returns number: the player's balance
 */
function getBalance(ns: NS): number {
	return ns.getServerMoneyAvailable('home');
}

function nodesUpgrade(ns: NS): boolean {
	const hacknet: Hacknet = ns.hacknet;

	let upgradesCompleted = true; // Track wether the required config has been reached or not

	while (hacknet.numNodes() < config.nodes) {
		// I still have nodes to buy
		const cost = hacknet.getPurchaseNodeCost();

		if (cost > getBalance(ns)) {
			// Not enough money to buy nodes
			upgradesCompleted = false;
			ns.print('Not enough money to purchase node. Needed ' + (cost - getBalance(ns)) + '. Skipping...');
			break;
		}

		const res = hacknet.purchaseNode();
		ns.print('Purchased hacknet Node with index ' + res);
	}

	for (let i = 0; i < hacknet.numNodes(); i++) {
		// For each node, try to fully upgrade elements in the following order: level -> RAM -> cores

		while (hacknet.getNodeStats(i).level < config.level.req) {
			// I still have levels to upgrade

			let levelBlock = config.level.block;
			if (hacknet.getNodeStats(i).level % levelBlock != 0) {
				// If current level is not a multiple of levelBlock, increase by 1 until a multiple is reached
				levelBlock = 1;
			}

			const cost = hacknet.getLevelUpgradeCost(i, levelBlock);

			if (cost > getBalance(ns)) {
				// Not enough money to upgrade node
				ns.print(
					'Not enough money to upgrade level on node ' +
						i +
						'. Needed ' +
						(cost - getBalance(ns)) +
						'. Skipping...',
				);
				upgradesCompleted = false;
				break;
			}

			hacknet.upgradeLevel(i, levelBlock);
			ns.print('Upgrading level on node ' + i + ' to level ' + hacknet.getNodeStats(i).level);
		}

		while (hacknet.getNodeStats(i).ram < config.ram.req) {
			// I still have ram to upgrade

			const cost = hacknet.getRamUpgradeCost(i, config.ram.block);

			if (cost > getBalance(ns)) {
				// Not enough money to upgrade node
				ns.print(
					'Not enough money to upgrade ram on node ' +
						i +
						'. Needed ' +
						(cost - getBalance(ns)) +
						'. Skipping...',
				);
				upgradesCompleted = false;
				break;
			}

			hacknet.upgradeRam(i, config.ram.block);
			ns.print('Upgrading RAM on node ' + i + ' to level ' + hacknet.getNodeStats(i).ram);
		}

		while (hacknet.getNodeStats(i).cores < config.cores.req) {
			// I still have cores to upgrade

			const cost = hacknet.getCoreUpgradeCost(i, config.cores.block);

			if (cost > getBalance(ns)) {
				// Not enough money to upgrade node
				ns.print(
					'Not enough money to upgrade cores on node ' +
						i +
						'. Needed ' +
						(cost - getBalance(ns)) +
						'. Skipping...',
				);
				upgradesCompleted = false;
				break;
			}

			hacknet.upgradeCore(i, config.cores.block);
			ns.print('Upgrading cores on node ' + i + ' to ' + hacknet.getNodeStats(i).cores);
		}
	}

	return upgradesCompleted;
}
