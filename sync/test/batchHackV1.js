// Heavily based on https://pastebin.com/sg8mTfYD -- https://steamclue.com/explanation-on-how-to-hwgw-manager-running-centralized-prep-and-farm-of-one-or-many-servers-bitburner/

export async function main(ns) {

	ns.tail();

	const growScript = "/bin/core/delayGrow.js";
	const weakenScript = "/bin/core/delayWeaken.js";
	const hackScript = "/bin/core/delayHack.js";

	const ramUsePerThread = ns.getScriptRam(weakenScript);
	const sleepPerIteration = 20; // ms - reduce if you need to go even faster, or raise if you get lag spikes
	const iterationPause = 1 // seconds - Pause after the script did touch every server and every target - how often should it run again
	const updateFiles = false; // forces the system to update the target files before running

	var randomArgument = 0; // This is a random argument that is passed to the scripts, so that they don't interfere with each other

	while (true) {


		let weakenPerThread = ns.weakenAnalyze(1, 1); // How much does a weaken decrease security by? Should be re evaluated every time, as it can change due to level up

		let targets = ["foodnstuff","n00dles", "sigma-cosmetics","joesguns","hong-fang-tea","harakiri-sushi","iron-gym","darkweb","home","zer0","CSEC","nectar-net","max-hardware","neo-net","silver-helix","phantasy","omega-net","computek","netlink","johnson-ortho","the-hub","crush-fitness","avmnite-02h","catalyst","I.I.I.I","summit-uni","syscore","rothman-uni","zb-institute","lexo-corp","rho-construction","millenium-fitness","alpha-ent","aevum-police","aerocorp","snap-fitness","galactic-cyber","global-pharm","omnia","deltaone","unitalife","solaris","defcomm","icarus","univ-energy","zeus-med","taiyang-digital","zb-def","infocomm","nova-med","titan-labs","applied-energetics","microdyne","run4theh111z","stormtech","helios","vitalife","fulcrumtech","4sigma","kuai-gong",".","omnitek","b-and-a","powerhouse-fitness","nwo","clarkinc","blade","ecorp","megacorp","fulcrumassets","The-Cave"]; //TODO: Replace with load from file
		const targetLimit = 2;

		// List of servers to run the script on
		let servers = ns.getPurchasedServers();
		//servers = servers.concat("home"); //TODO: Enable this 

		if (targetLimit != 0) {
			targets = targets.slice(0, targetLimit);
		}

		// Loop the targets
		for (let target of targets) {

			// Check if the target is valid
			if (!ns.serverExists(target) || !ns.hasRootAccess(target) || ns.getServerMaxMoney(target) < 1) {
				ns.tprint("Skipping invalid target: " + target + ". Server exists: " + ns.serverExists(target) + ", has root access: " + ns.hasRootAccess(target) + ", has max money: " + (ns.getServerMaxMoney(target) > 0));
				continue;
			}

			//Target variables
			const maxMoney = ns.getServerMaxMoney(target);
			const minSecurityLevel = ns.getServerMinSecurityLevel(target);
			let currentSecLevel = ns.getServerSecurityLevel(target);
			let availableMoney = Math.max(1, ns.getServerMoneyAvailable(target));
			let growthCalculated = false;
			let requiredGrowThreads = 0;
			let batchDelay = 0;

			// Loop the servers
			for (let server of servers) {

				// Check if the server is valid
				if (!ns.serverExists(server) || !ns.hasRootAccess(server)) {
					ns.tprint("Skipping invalid server: " + server + ". Server exists: " + ns.serverExists(server) + ", has root access: " + ns.hasRootAccess(server));
					continue
				};

				// Estimate available threads on the server //TODO: Optimize splitting hack and weaken/grow threads  (Hack uses .5 GB less than weaken)
				let threadsToUse = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ramUsePerThread);

				// If the server is busy, ignore it
				if (threadsToUse < 1) continue;

				// ----------------- PREP -----------------

				// Check if files exist, if not, upload them
				if (!ns.fileExists(weakenScript, server) || updateFiles) {
					ns.print("Setting up files on " + server);
					await ns.scp([weakenScript, growScript, hackScript], server, "home");
				}

				// WEAKEN
				if (currentSecLevel > minSecurityLevel) {
					const reducedSecLev = weakenPerThread * threadsToUse;

					// If weaken with all threads is too strong, evaluate how many threads are needed to reach minSecurityLevel
					if (currentSecLevel - reducedSecLev < minSecurityLevel) {
						threadsToUse = Math.ceil((currentSecLevel - minSecurityLevel) / weakenPerThread);
						currentSecLevel = minSecurityLevel;
					} else {
						// Otherwise weaken with all threads available
						currentSecLevel -= reducedSecLev;
					}
					// Launch the script
					ns.exec(weakenScript, server, threadsToUse, target, 0, randomArgument++);
				} else
					// GROW
					if (availableMoney < maxMoney && (requiredGrowThreads != 0 || !growthCalculated)) {

						// Evaluate the number of grow threads needed to reach max growth
						if (!growthCalculated) {
							requiredGrowThreads = Math.ceil(ns.growthAnalyze(target, maxMoney / availableMoney));
							growthCalculated = true;
						}

						threadsToUse = Math.min(requiredGrowThreads, threadsToUse)

						//requiredGrowThreads will save how many more threads are needed, if any, for this iteration    
						requiredGrowThreads -= threadsToUse;

						//Grow will raise the security level.
						currentSecLevel += ns.growthAnalyzeSecurity(threadsToUse);
						ns.exec(growScript, server, threadsToUse, target, 0, randomArgument++);
					}

					// ----------------- HWGW -----------------

					else {
						// Min threads for each batch
						const minBatchThreads = 6;

						//Below this value we risk that not all HWGW execute, so lets not even try that and wait for more threads or other tasks in next rotation.
						if (threadsToUse < minBatchThreads)
							continue;

						const moneyPerHack = ns.hackAnalyze(target);

						// If we are so weak we cant even get a single dime out of a server, lets just not even try it. And also get notified.
						if (moneyPerHack == 0) {
							ns.tprint("INFO - We can not effectively hack this server: " + target);
							continue;
						}

						// Number of threads to get 90% of the server money
						let hackThreads = Math.ceil(0.9 / moneyPerHack);

						// Check if 90% is a viable option, considering the required grow and weaken after
						// If not, decrese the hack threads to a reasonable amount
						if (hackThreads * minBatchThreads * 2 > threadsToUse) { // If we do hack 90% of availableMoney we will need more grow threads to compensate, so we double the needed threadsToUse.
							hackThreads = Math.floor(threadsToUse / minBatchThreads);
						}

						//Calculate how we divide our threads for HWGW.
						// Grow threads anre evaluated based on the numer of hack threads and the amount per hack
						const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - Math.min(0.99, moneyPerHack * hackThreads))));
						// This has to counter the hack threads
						const weakenThreads = Math.ceil(ns.hackAnalyzeSecurity(hackThreads) / weakenPerThread);
						// This has to counter the grow threads
						const weakenThreads2 = Math.ceil(ns.growthAnalyzeSecurity(growThreads) / weakenPerThread);

						// If the required threads are greater then the available threads, signal the error and skip the operation
						ns.tprint("INFO: hackThreads: " + hackThreads + " | growThreads: " + growThreads + " | weakenThreads: " + weakenThreads + " | weakenThreads2: " + weakenThreads2 + " | threadsToUse: " + threadsToUse + " | minBatchThreads: " + minBatchThreads);
						if (hackThreads + growThreads + weakenThreads + weakenThreads2 > threadsToUse) {
							ns.tprint("ERROR: some threads did not start, because we need more minimum threads per batch. raise 'minBatchThreads'");
							continue;
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
						const wea1T = batchDelay;
						const wea2T = batchDelay + threadDelay * 2;
						const growT = batchDelay + threadDelay + weakTime - growTime;
						const hackT = batchDelay + weakTime - hackTime - threadDelay;

						//Execute the threads. 
						ns.exec(weakenScript, server, weakenThreads, target, wea1T, randomArgument);
						ns.exec(weakenScript, server, weakenThreads2, target, wea2T, randomArgument);
						ns.exec(growScript, server, growThreads, target, growT, randomArgument);
						ns.exec(hackScript, server, hackThreads, target, hackT, randomArgument++);

						// Batch delay is needed to avoid overlapping effects on servers
						batchDelay += 4 * threadDelay;
					}

				await ns.sleep(sleepPerIteration);
			}
			await ns.sleep(sleepPerIteration);
		}
		if (updateFiles) updateFiles = false;
		await ns.sleep(1000 * iterationPause);
	}
}