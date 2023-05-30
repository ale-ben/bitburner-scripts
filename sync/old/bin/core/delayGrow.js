export async function main(ns) {
	const hostname = ns.args[0];
	const delayMS = ns.args[1];
	await ns.sleep(delayMS);
	await ns.grow(hostname);
}