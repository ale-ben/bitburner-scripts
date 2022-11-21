// Heavily based on https://pastebin.com/sg8mTfYD -- https://steamclue.com/explanation-on-how-to-hwgw-manager-running-centralized-prep-and-farm-of-one-or-many-servers-bitburner/

// ------------------ HWGW ------------------
function launchHWGW(ns, host, target, threadsToUse, targetStats, scripts, randomArgument, weakenPerThread) {
	const minNeededThreads = 6;

	if (threadsToUse < minNeededThreads) {
		ns.tprint("WARN - Not enough threads to safely launch HWGW");
		return false;
	}

	const moneyPerHack = ns.hackAnalyze(target);

	if (moneyPerHack == 0) {
		ns.tprint("INFO - Unable to effectively hack " + target + targetStats["currentMoney"]);
		return false;
	}


	let hackThreads = Math.ceil(0.9 / moneyPerHack);

	// Check if 90% is a viable option, considering the required grow and weaken after
	// If not, decrese the hack threads to a reasonable amount
	if (hackThreads * minNeededThreads * 2 > threadsToUse) { // If we do hack 90% of availableMoney we will need more grow threads to compensate, so we double the needed threadsToUse.
		hackThreads = Math.floor(threadsToUse / minNeededThreads);
	}

	//Calculate how we divide our threads for HWGW.
	// Grow threads anre evaluated based on the numer of hack threads and the amount per hack
	const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - Math.min(0.99, moneyPerHack * hackThreads))));
	// This has to counter the hack threads
	const weakenThreads = Math.ceil(ns.hackAnalyzeSecurity(hackThreads) / weakenPerThread);
	// This has to counter the grow threads
	const weakenThreads2 = Math.ceil(ns.growthAnalyzeSecurity(growThreads) / weakenPerThread);

	// If the required threads are greater then the available threads, signal the error and skip the operation
	//ns.tprint("INFO: hackThreads: " + hackThreads + " | growThreads: " + growThreads + " | weakenThreads: " + weakenThreads + " | weakenThreads2: " + weakenThreads2 + " | threadsToUse: " + threadsToUse + " | minNeededThreads: " + minNeededThreads);
	if (hackThreads + growThreads + weakenThreads + weakenThreads2 > threadsToUse) {
		ns.tprint("ERROR: some threads did not start, because we need more minimum threads per batch. raise 'minBatchThreads'");
		return false;
	}

	// Evaluate the thread delays
	const weakTime = ns.getWeakenTime(target);
	const growTime = ns.getGrowTime(target);
	const hackTime = ns.getHackTime(target);

	/*
	const wea1 = batchDelay;
	const wea2 = wea1 + threadDelay * 2;
	const grow = wea2 + weakTime - growTime - threadDelay;
	const hack = grow + growTime - hackTime - threadDelay * 2;
	*/
	const threadDelay = 150; //ms
	// This is equivalent to the commented code above, but it is clearer
	const wea1T = targetStats["batchDelay"];
	const wea2T = targetStats["batchDelay"] + threadDelay * 2;
	const growT = targetStats["batchDelay"] + threadDelay + weakTime - growTime;
	const hackT = targetStats["batchDelay"] + weakTime - hackTime - threadDelay;

	//Execute the threads. 
	ns.exec(scripts["weaken"], host, weakenThreads, target, wea1T, randomArgument);
	ns.exec(scripts["weaken"], host, weakenThreads2, target, wea2T, randomArgument);
	ns.exec(scripts["grow"], host, growThreads, target, growT, randomArgument);
	ns.exec(scripts["hack"], host, hackThreads, target, hackT, randomArgument);

	// Batch delay is needed to avoid overlapping effects on servers
	targetStats["batchDelay"] += 4 * threadDelay;


	return true;
}

// ------------------ PREP ------------------

// Grows the server to max money
function prepGrow(ns, host, target, threadsToUse, targetStats, growScript, randomArgument) {
	if (!targetStats["growthCalculated"]) {
		ns.print("INFO - Calculating growth for " + target + "max " + targetStats["maxMoney"] + " cur " + targetStats["currentMoney"]);
		targetStats["growthCalculated"] = true;
		targetStats["requiredGrowThreads"] = Math.ceil(ns.growthAnalyze(target, targetStats["maxMoney"] / targetStats["currentMoney"]));
	}

	const threads = Math.min(threadsToUse, targetStats["requiredGrowThreads"]);
	targetStats["requiredGrowThreads"] -= threads;
	targetStats["currentSecurityLevel"] += ns.growthAnalyzeSecurity(threads);

	ns.exec(growScript, host, threads, target, 0, randomArgument);
}

function prepWeaken(ns, host, target, threadsToUse, targetStats, weakenScript, randomArgument, weakenPerThread) {
	const reducedSecLev = weakenPerThread * threadsToUse;
	let threads = threadsToUse;

	if (targetStats["currentSecurityLevel"] - reducedSecLev < targetStats["minSecurityLevel"]) {
		threads = Math.ceil((targetStats["currentSecurityLevel"] - targetStats["minSecurityLevel"]) / weakenPerThread); // Evaluate the number of needed threads to reach minSecurityLevel
		targetStats["currentSecurityLevel"] = targetStats["minSecurityLevel"]; // Update the current security level to minSecurityLevel in order to allow next server to proceed
	} else {
		targetStats["currentSecurityLevel"] -= reducedSecLev; // Otherwise weaken with all threads available and update the current security level
	}

	ns.exec(weakenScript, host, threads, target, 0, randomArgument, weakenPerThread); // Start the weakening

}

// ------------------ AUX ------------------

async function syncScripts(ns, host, scripts, override) {
	if (!ns.fileExists(scripts["weaken"], host) || override) {
		ns.print("INFO - Setting up files on " + host);
		await ns.scp([scripts["weaken"], scripts["grow"], scripts["hack"]], host, "home");
	}
}

// ------------------ MAIN ------------------

export async function main(ns) {
	ns.tail();

	const scripts = {
		weaken: "/bin/core/delayWeaken.js",
		grow: "/bin/core/delayGrow.js",
		hack: "/bin/core/delayHack.js"
	}

	const ramUsePerThread = ns.getScriptRam(scripts["weaken"]);

	let randomArgument = 0; // This is a random argument that is passed to the scripts, so that they don't interfere with each other
	let weakenPerThread = ns.weakenAnalyze(1, 1); // How much does a weaken decrease security by? Should be re evaluated every time, as it can change due to level up

	const iterationPause = 1; // s - sleep time between each full loop of server and targets
	const sleepPerIteration = 20; // ms - sleep time after each iteration
	const updateFiles = false; // If true, the scripts will be updated on the server before running

	while (true) {

		const targets = ["foodnstuff", "joesguns", "n00dles"]; // List of servers to attack

		const servers = ns.getPurchasedServers(); // List of servers to run the script on

		for (let target of targets) {

			if (!ns.serverExists(target) || !ns.hasRootAccess(target) || ns.getServerMaxMoney(target) < 1) {
				ns.tprint("WARN - Skipping invalid target: " + target + ". Server exists: " + ns.serverExists(target) + ", has root access: " + ns.hasRootAccess(target) + ", has max money: " + (ns.getServerMaxMoney(target) > 0));
				continue;
			}

			const targetStats = {
				"maxMoney": ns.getServerMaxMoney(target),
				"currentMoney": Math.max(ns.getServerMoneyAvailable(target),1),
				"currentSecurityLevel": ns.getServerSecurityLevel(target),
				"minSecurityLevel": ns.getServerMinSecurityLevel(target),
				"growthCalculated": false,
				"requiredGrowthThreads": 0,
				"batchDelay": 0
			}

			ns.print(servers)

			for (let server of servers) {

				ns.print(server)

				if (!ns.serverExists(server) || !ns.hasRootAccess(server)) {
					ns.tprint("WARN - Skipping invalid server: " + server + ". Server exists: " + ns.serverExists(server) + ", has root access: " + ns.hasRootAccess(server));
					continue;
				}

				const availThreads = ((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ramUsePerThread);

				if (availThreads < 1) {
					ns.print("WARN - Skipping server " + server + " due to lack of threads");
					continue;
				}

				await syncScripts(ns, server, scripts, updateFiles); // Check if the server has the scripts, and if not, copy them over

				if (targetStats["currentSecurityLevel"] > targetStats["minSecurityLevel"]) {
					prepWeaken(ns, server, target, availThreads, targetStats, scripts["weaken"], randomArgument++, weakenPerThread);
				} else if (targetStats["currentMoney"] < targetStats["maxMoney"] && (!targetStats["growthCalculated"] || targetStats["requiredGrowthThreads"] > 0)) {
					prepGrow(ns, server, target, availThreads, targetStats, scripts["grow"], randomArgument++);
				} else {
					if (!launchHWGW(ns, server, target, availThreads, targetStats, scripts, randomArgument++, weakenPerThread)) continue;
				}

				await ns.sleep(sleepPerIteration);
			}

			await ns.sleep(sleepPerIteration);
		}

		await ns.sleep(iterationPause * 1000);
	}
}