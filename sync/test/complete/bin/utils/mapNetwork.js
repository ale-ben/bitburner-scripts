function analyzeServer(ns, host) {
    const maxMoney = ns.getServerMaxMoney(host);
    const gainPercent = ns.hackAnalyze(host);
    const secTime = ns.getWeakenTime(host);
    const growTime = ns.getGrowTime(host);
    const hackTime = ns.getHackTime(host);
    // Calculate the money per second we can make on this server with a single batch single thread assuming HWGW hacking takes as much time as the longest between grow, hack, and weaken (https://bitburner.readthedocs.io/en/latest/advancedgameplay/hackingalgorithms.html)
    const batchTime = Math.max(secTime, hackTime, growTime) / 1000; // in seconds
    const moneyPerSec = Math.round((maxMoney * gainPercent) / batchTime);
    return {
        name: host,
        ram: ns.getServerMaxRam(host),
        money: maxMoney,
        sec: ns.getServerMinSecurityLevel(host),
        batchTime: batchTime,
        moneyPerSec: moneyPerSec
    };
}
/**
 * Maps the network using a BFS approach and returns an object with available and unavailable servers
 * @param ns
 * @returns
 */
function mapNetwork(ns) {
    const serversToCheck = ["home"];
    const serversChecked = [];
    const serversAvailable = [];
    const serversUnavailable = {};
    while (serversToCheck.length > 0) {
        const serverToCheck = serversToCheck.pop();
        // If we're not on a server, skip it
        if (!serverToCheck)
            continue;
        // If we've already checked this server, skip it
        if (serversChecked.find((s) => s === serverToCheck))
            continue;
        // Add the server to the checked list
        serversChecked.push(serverToCheck);
        // If we have root access, add it to the available list
        if (ns.hasRootAccess(serverToCheck))
            serversAvailable.push(analyzeServer(ns, serverToCheck));
        else {
            // If we don't have root access, add it to the unavailable list with the number of ports required
            if (!serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)])
                serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)] = [];
            serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)].push(serverToCheck);
        }
        // Get the servers connected to this server
        const results = ns.scan(serverToCheck);
        // Add the servers connected to this server to the list of servers to check if we haven't already checked them
        results.forEach((result) => {
            if (!serversChecked.find((s) => s === result))
                serversToCheck.push(result);
        });
    }
    return { avail: serversAvailable, notAvail: serversUnavailable };
}
export function main(ns) {
    ns.disableLog("ALL");
    const availFile = "/data/availServers.txt";
    const notAvailFile = "/data/unavailServers.txt";
    const res = mapNetwork(ns);
    ns.print("Available servers: " + JSON.stringify(res.avail));
    ns.print("Unavailable servers: " + JSON.stringify(res.notAvail));
    ns.write(availFile, JSON.stringify(res.avail.sort((a, b) => a.name.localeCompare(b.name))), "w");
    ns.write(notAvailFile, JSON.stringify(res.notAvail), "w");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwTmV0d29yay5qcyIsInNvdXJjZVJvb3QiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvc291cmNlcy8iLCJzb3VyY2VzIjpbImNvbXBsZXRlL2Jpbi91dGlscy9tYXBOZXR3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVBLFNBQVMsYUFBYSxDQUFDLEVBQU8sRUFBRSxJQUFhO0lBQzVDLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXRDLDBRQUEwUTtJQUMxUSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUMsSUFBSSxDQUFDLENBQUMsYUFBYTtJQUMzRSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFFLFNBQVMsQ0FBRSxDQUFDO0lBRXJFLE9BQU87UUFDTixJQUFJLEVBQUUsSUFBSTtRQUNWLEdBQUcsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQztRQUM3QixLQUFLLEVBQUUsUUFBUTtRQUNmLEdBQUcsRUFBRSxFQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFdBQVcsRUFBRSxXQUFXO0tBQ3hCLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsVUFBVSxD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