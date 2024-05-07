import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
	const hostname = ns.args[0];

	if (!hostname) {
		throw new Error('No hostname specified.');
	}
	if (typeof hostname !== 'string') {
		throw new Error('Hostname must be a string.');
	}

	const res = dfsScan(ns, hostname, 'home', '');
	printResults(ns, res);
}

/**
 * Scan in dfs the node tree
 * @param ns
 * @param target
 * @param node
 * @param parent
 * @returns
 */
function dfsScan(ns: NS, target: string, node: string, parent: string): string[] {
	if (node.toLowerCase() === target.toLowerCase()) {
		// If target is found, return an array with the darget name
		return [target];
	}

	for (const elem of ns.scan(node)) {
		// For each neighbor that is neither my parent, nor myself
		if (elem === node || elem === parent) continue;

		// Scan the neighbor
		const res = dfsScan(ns, target, elem, node);

		// If the neighbor returned something, this is the right neighbor
		if (res.length > 0) {
			return res.concat([node]);
		}
	}

	return [];
}

function printResults(ns: NS, res: string[]) {
	ns.tprint(res.reverse().join(' -> '));
}
