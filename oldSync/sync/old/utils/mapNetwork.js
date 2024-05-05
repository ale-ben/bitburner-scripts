function mapNetwork(ns) {
    const serversToCheck = ["home"];
    const serversChecked = [];
    const serversAvailable = [];
    const serversUnavailable = {};
    while (serversToCheck.length > 0) {
        const serverToCheck = serversToCheck.pop();
        if (!serverToCheck)
            continue;
        if (serversChecked.find((s) => s === serverToCheck))
            continue;
        serversChecked.push(serverToCheck);
        if (ns.hasRootAccess(serverToCheck))
            serversAvailable.push({
                name: serverToCheck,
                ram: ns.getServerMaxRam(serverToCheck),
                money: ns.getServerMaxMoney(serverToCheck)
            });
        else {
            if (!serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)])
                serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)] = [];
            serversUnavailable[ns.getServerNumPortsRequired(serverToCheck)].push(serverToCheck);
        }
        const results = ns.scan(serverToCheck);
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
    const avail = res.avail;
    const notAvail = res.notAvail;
    ns.print("Available servers: " + JSON.stringify(avail));
    ns.print("Unavailable servers: " + JSON.stringify(notAvail));
    ns.write(availFile, JSON.stringify(avail), "w");
    ns.write(notAvailFile, JSON.stringify(notAvail), "w");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwTmV0d29yay5qcyIsInNvdXJjZVJvb3QiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvc291cmNlcy8iLCJzb3VyY2VzIjpbIm1hcE5ldHdvcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBWUEsU0FBUyxVQUFVLENBQUMsRUFBTztJQUkxQixNQUFNLGNBQWMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztJQUNwQyxNQUFNLGdCQUFnQixHQUFrQixFQUFFLENBQUM7SUFDM0MsTUFBTSxrQkFBa0IsR0FBbUIsRUFBRSxDQUFDO0lBRTlDLE9BQU8sY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDakMsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzNDLElBQUksQ0FBQyxhQUFhO1lBQ2pCLFNBQVM7UUFDVixJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxhQUFhLENBQUM7WUFDbEQsU0FBUztRQUNWLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQztZQUNsQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ3JCLElBQUksRUFBRSxhQUFhO2dCQUNuQixHQUFHLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUM7Z0JBQ3RDLEtBQUssRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDO2FBQzFDLENBQUMsQ0FBQzthQUNDO1lBQ0osSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbkUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3RFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUNwRjtRQUVELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFdkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDO2dCQUM1QyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FDRCxDQUFDO0tBQ0Y7SUFDRCxPQUFPLEVBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCxNQUFNLFVBQVUsSUFBSSxDQUFDLEVBQU87SUFDM0IsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQixNQUFNLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQztJQUMzQyxNQUFNLFlBQVksR0FBRywwQkFBMEIsQ0FBQztJQUVoRCxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0IsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUN4QixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQzlCLEVBQUUsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3hELEVBQUUsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRTdELEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEQsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN2RCxDQUFDIn0=