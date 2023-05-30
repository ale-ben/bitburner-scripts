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
            serversAvailable.push({ name: serverToCheck, ram: ns.getServerMaxRam(serverToCheck), money: ns.getServerMaxMoney(serverToCheck) });
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
    ns.write(availFile, JSON.stringify(res.avail), "w");
    ns.write(notAvailFile, JSON.stringify(res.notAvail), "w");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwTmV0d29yay5qcyIsInNvdXJjZVJvb3QiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvc291cmNlcy8iLCJzb3VyY2VzIjpbImNvbXBsZXRlL2Jpbi91dGlscy9tYXBOZXR3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlBOzs7O0dBSUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxFQUFPO0lBSzFCLE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsTUFBTSxjQUFjLEdBQWEsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sZ0JBQWdCLEdBQWtCLEVBQUUsQ0FBQztJQUMzQyxNQUFNLGtCQUFrQixHQUFtQixFQUFFLENBQUM7SUFFOUMsT0FBTyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNqQyxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDM0Msb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxhQUFhO1lBQ2pCLFNBQVM7UUFDVixnREFBZ0Q7UUFDaEQsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssYUFBYSxDQUFDO1lBQ2xELFNBQVM7UUFDVixxQ0FBcUM7UUFDckMsY0FBYyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuQyx1REFBdUQ7UUFDdkQsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQztZQUNsQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2FBQzdIO1lBQ0osaUdBQWlHO1lBQ2pHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ25FLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0RSxrQkFBa0IsQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDcEY7UUFFRCwyQ0FBMkM7UUFDM0MsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV2Qyw4R0FBOEc7UUFDOUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDO2dCQUM1QyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FDRCxDQUFDO0tBQ0Y7SUFDRCxPQUFPLEVBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCxNQUFNLFVBQVUsSUFBSSxDQUFDLEVBQU87SUFDM0IsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQixNQUFNLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQztJQUMzQyxNQUFNLFlBQVksR0FBRywwQkFBMEIsQ0FBQztJQUVoRCxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0IsRUFBRSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzVELEVBQUUsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUVqRSxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwRCxFQUFFLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMzRCxDQUFDIn0=