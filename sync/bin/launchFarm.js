export async function main(ns) {	
	// Servers in this list will be ignored
	const serverBlacklist = ["home"];
	const fileList = ["/bin/launchFarm.js","/bin/farmLocalhost.js"]; 
	const localhost = ns.getHostname();

	let servers = ns.scan();
	for (const host of servers) {
		const hasRootAccess = await ns.hasRootAccess(host);
		if (!serverBlacklist.includes(host) && hasRootAccess) {
			await ns.scp(fileList,host);
			await ns.exec("/bin/launchFarm.js", host);
		}
	}

	if (!serverBlacklist.includes(localhost)) {
		ns.print("Launching farm on " + localhost)
		ns.spawn("/bin/farmLocalhost.js", localhost)
	} else {
		ns.print(localhost + " is in server blacklist.\nCannot launch script here.")
	}
}