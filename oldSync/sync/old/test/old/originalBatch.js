/** @param {NS} ns **/

// Used for importing targets from other scripts
//import { FileHandler } from "/data/file-handler.js";

export async function main(ns) {
    //Logs are nice to know whats going on
    ns.disableLog('sleep');
    ns.disableLog('getServerMaxRam');
    ns.disableLog('getServerUsedRam');
    ns.disableLog('getServerSecurityLevel');
    ns.disableLog('getServerMinSecurityLevel');
    ns.disableLog('getServerMaxMoney');
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('getHackingLevel');
    // If you do not want an open tail window with information what this script is doing on every start, you can remove/comment the tail line below.
    ns.tail();

    // Used for importing targets from other scripts
    //const fileHandlerServers = new FileHandler(ns, "/database/servers.txt");
    //const fileHandlerTarget = new FileHandler(ns, "/database/target.txt");

    const ramUsePerThread = ns.getScriptRam("/bin/core/delayWeaken.js");
    const weakenPerThread = ns.weakenAnalyze(1, 1);
    const reservedHomeRam = 50; //GB - change if you want to reserve more of you home ram
    const sleepPerIteration = 20; // ms - reduce if you need to go even faster, or raise if you get lag spikes
    const iterationPause = 1 // seconds - Pause after the script did touch every server and every target - how often should it run again

    // This will be used to make sure that every batch goes through and is not blocked my "script already running with same arguments"
    let randomArgument = 1;

    while (true) {

        // read (new) targets - if you do not use fileHandlers like i do, just throw in an array of targets or a function or anything really. 
        // If desperate or no clue, use the commented lines instead and change target to your highest/best target you currently have
        //const targets = await fileHandlerServers.read();
        const targets = ["foodnstuff", "joesguns", "n00dles"];

        // get (new) servers + home
        let servers = ns.getPurchasedServers();
        servers = servers.concat("home");

        for (let target of targets) {
            // ...we stick with THE BEST one. Adjust the criteria to your liking.

            //Is our given server even useable?
            if (!ns.serverExists(target) || !ns.hasRootAccess(target) || ns.getServerMaxMoney(target) < 1)
                continue;

            //Target variables
            const maxMoney = ns.getServerMaxMoney(target);
            const minSecurityLevel = ns.getServerMinSecurityLevel(target);
            let currentSecLevel = ns.getServerSecurityLevel(target);
            let availableMoney = Math.max(1, ns.getServerMoneyAvailable(target));
            let growthCalculated = false;
            let requiredGrowThreads = 0;
            let batchDelay = 0;

            for (let myServer of servers) {
                if (!ns.serverExists(myServer) || !ns.hasRootAccess(myServer))
                    continue;
                //Calculate possible threads - If "home", we want some spare some spare RAM
                let threadsToUse = Math.floor((ns.getServerMaxRam(myServer) - ns.getServerUsedRam(myServer) - (myServer == "home" ? reservedHomeRam : 0)) / ramUsePerThread);

                //Come on get out of here we have no use for you if you have no capacity
                if(threadsToUse < 1)
                    continue;

				// Check if files exist, if not, upload them
				if (!ns.fileExists("/bin/core/delayWeaken.js", myServer)) {
					ns.print("Setting up files on " + myServer);
					await ns.scp(["/bin/core/delayWeaken.js", "/bin/core/delayGrow.js", "/bin/core/delayHack.js"], myServer, "home");
				}

                //Break the server down to its minimum sec level.
                if (currentSecLevel > minSecurityLevel) {
                    const reducedSecLevel = weakenPerThread * threadsToUse;
                    //Too strong? Only use needed threads then
                    if (currentSecLevel - reducedSecLevel < minSecurityLevel) {
                        threadsToUse = Math.ceil((currentSecLevel - minSecurityLevel) / weakenPerThread);
                        currentSecLevel = minSecurityLevel;
                    }
                    else
                        currentSecLevel -= reducedSecLevel;
                    ns.exec("/bin/core/delayWeaken.js", myServer, threadsToUse, target, 0, randomArgument++);
                }
                //Grow the server
                else if (availableMoney < maxMoney && (requiredGrowThreads != 0 || !growthCalculated)) {
                    if (!growthCalculated) {
                        requiredGrowThreads = Math.ceil(ns.growthAnalyze(target, maxMoney / availableMoney));
                        growthCalculated = true;
                    }
                    //Do not use more than needed
                    threadsToUse = Math.min(requiredGrowThreads, threadsToUse)

                    //requiredGrowThreads will save how many more threads are needed, if any, for this iteration    
                    requiredGrowThreads -= threadsToUse;

                    //Let's also not forget that this will raise the security level.
                    currentSecLevel += ns.growthAnalyzeSecurity(threadsToUse);
                    ns.exec("/bin/core/delayGrow.js", myServer, threadsToUse, target, 0, randomArgument++);
                }
                // Fully prepped? Let's do batching then
                else {
                    //How many threads per batch with one Hack thread? Adjust if needed
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

                    // Let's dream big and completely take 90% of the availableMoney! how many threads we need for that?
                    let hackThreads = Math.ceil(0.25 / moneyPerHack); //FIXME: Il numero di threads è completamente sbagliato ed è > threadsToUse

                    // Reality check. are we eben able to do so? Do we have lots of threads to waste ehm grow i mean? If not, just take a part of our threads for hack and go.
                    if (hackThreads * minBatchThreads * 2 > threadsToUse) { // If we do hack 90% of availableMoney we will need more grow threads to compensate, so we double the needed threadsToUse.
                        hackThreads = Math.floor(threadsToUse / minBatchThreads);
                    }

                    //Let's calculate how we divide our threads for HWGW.
                    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - Math.min(0.99, moneyPerHack * hackThreads))));
                    const weakenThreads = Math.ceil(ns.hackAnalyzeSecurity(hackThreads) / weakenPerThread);
                    const weakenThreads2 = Math.ceil(ns.growthAnalyzeSecurity(growThreads) / weakenPerThread);

                    if (hackThreads + growThreads + weakenThreads + weakenThreads2 > threadsToUse) {
                        //ns.tprint("ERROR: some threads did not start, because we need more minimum threads per batch. raise 'minBatchThreads'"); //TODO: Ri abilitare dopo aver corretto bug
						continue;
					}

                    //Now get these threads executed. 
                    const threadDelay = 150; //ms
                    ns.exec("/bin/core/delayWeaken.js", myServer, weakenThreads, target, batchDelay, randomArgument);
                    ns.exec("/bin/core/delayWeaken.js", myServer, weakenThreads2, target, threadDelay * 2 + batchDelay, randomArgument);
                    ns.exec("/bin/core/delayGrow.js", myServer, growThreads, target, ns.getWeakenTime(target) - ns.getGrowTime(target) + threadDelay + batchDelay, randomArgument);
                    ns.exec("/bin/core/delayHack.js", myServer, hackThreads, target, ns.getWeakenTime(target) - ns.getHackTime(target) - threadDelay + batchDelay, randomArgument++);
                    //If we would fire the next HWGW without this batchDelay, they might intersect. we could also use ns.sleep but ain't nobody got time for that
                    batchDelay += 4*threadDelay;
                }
                await ns.sleep(sleepPerIteration);
            }
            await ns.sleep(sleepPerIteration);
        }
        await ns.sleep(iterationPause*1000);
    }
}