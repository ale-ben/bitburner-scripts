export async function main(ns) {
	const hostname = ns.args[0];
	await ns.grow(hostname); 
}