import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
	const hostname = ns.args[0];
	if (!hostname) {
		throw new Error('No hostname specified.');
	}
	if (typeof hostname !== 'string') {
		throw new Error('Hostname must be a string.');
	}
	const delayMS = ns.args[1];
	if (!delayMS) {
		throw new Error('No delay specified.');
	}
	if (typeof delayMS !== 'number') {
		throw new Error('Delay must be a number.');
	}
	await ns.sleep(delayMS);
	await ns.weaken(hostname);
}
