function getBalance(ns) {
	return ns.getServerMoneyAvailable("home");
}

export async function main(ns) {
	var config = {
		"nodes": 9,
		"level": {
			"req": 50,
			"block": 5
		},
		"ram": {
			"req": 16,
			"block": 1
		},
		"cores": {
			"req": 8,
			"block": 1
		}
	}

	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	
	if (nodesUpgrade(ns, config)) {
		ns.tail();
		ns.print("INFO: Hacknet nodes upgraded successfully.");
		ns.tprint("INFO: Hacknet nodes upgraded successfully.");
	}
}

function nodesUpgrade(ns, config) {
	const hacknet = ns.hacknet;

	var upgradesCompleted = true;

	while (hacknet.numNodes() < config.nodes) {
		var cost = hacknet.getPurchaseNodeCost();
		if (cost > getBalance(ns)) {
			//ns.print("Not enough money to purchase node. Needed " + (cost - getBalance(ns)) + ". Skipping...");
			upgradesCompleted = false;
			break;
		}
		var res = hacknet.purchaseNode();
		ns.print("Purchased hacknet Node with index " + res);
	};

	for (var i = 0; i < hacknet.numNodes(); i++) {
		while (hacknet.getNodeStats(i).level < config.level.req) {
			var levelBlock = config.level.block;
			if (hacknet.getNodeStats(i).level%5!=0) levelBlock = 1;
			var cost = hacknet.getLevelUpgradeCost(i, levelBlock);
			if (cost > getBalance(ns)) {
				//ns.print("Not enough money to upgrade level on node " + i + ". Needed " + (cost - getBalance(ns)) + ". Skipping...");
				upgradesCompleted = false;
				break;
			};
			hacknet.upgradeLevel(i, levelBlock);
			ns.print("Upgrading level on node " + i + " to level " + hacknet.getNodeStats(i).level);
		}

		while (hacknet.getNodeStats(i).ram < config.ram.req) {
			var cost = hacknet.getRamUpgradeCost(i, config.ram.block);
			if (cost > getBalance(ns)) {
				//ns.print("Not enough money to upgrade RAM on node " + i + ". Needed " + (cost - getBalance(ns)) + ". Skipping...");
				upgradesCompleted = false;
				break;
			}
			hacknet.upgradeRam(i, config.ram.block);
			ns.print("Upgrading RAM on node " + i + " to level " + hacknet.getNodeStats(i).ram);
		}

		while (hacknet.getNodeStats(i).cores < config.cores.req) {
			var cost = hacknet.getCoreUpgradeCost(i, config.cores.block);
			if (cost > getBalance(ns)) {
				//ns.print("Not enough money to upgrade cores on node " + i + ". Needed " + (cost - getBalance(ns)) + ". Skipping...");
				upgradesCompleted = false;
				break;
			}
			hacknet.upgradeCore(i, config.cores.block);
			ns.print("Upgrading cores on node " + i + " to " + hacknet.getNodeStats(i).cores);
		}
	}

	return upgradesCompleted;
}