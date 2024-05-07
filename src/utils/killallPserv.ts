import { NS } from '@ns';

export async function main(ns: NS) {
	const servers = ns.getPurchasedServers();
	servers.forEach((server) => {
		ns.print('INFO: Killing all scripts on ' + server);
		ns.killall(server);
	});

	return;
}
