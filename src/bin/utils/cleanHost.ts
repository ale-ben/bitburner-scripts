import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
	const scripts = ns.ls('home', '.js');
	scripts.forEach((file) => {
		ns.print('Removing ' + file);
		ns.rm(file);
	});

	const data = ns.ls('home', 'data/');
	data.forEach((file) => {
		ns.print('Removing ' + file);
		ns.rm(file);
	});
}
