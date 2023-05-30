async function attack(ns) {
    ns.run("/bin/centralizedAttack.js"); //TODO: Launch harvest if new nodes
    ns.run("/bin/utils/mapNetwork.js");
}
async function manageNodes(ns) {
    ns.run("/bin/manager/manageHacknetNodes.js");
}
async function harvest(ns) {
    ns.run("/bin/centralizedLaunchHarvest.js", 1, "foodnstuff");
}
async function manageServers(ns) {
    ns.run("/bin/manager/manageServers.js");
}
export async function main(ns) {
    ns.disableLog("run");
    ns.disableLog("sleep");
    ns.disableLog("exec");
    ns.disableLog("scp");
    const functionList = [
        {
            name: "attack",
            func: attack,
            status: false,
            interval: 10
        },
        {
            name: "manageNodes",
            func: manageNodes,
            status: false,
            interval: 5 // in minutes
        },
        {
            name: "harvest",
            func: harvest,
            status: false,
            interval: 10 // in minutes
        },
        {
            name: "manageServers",
            func: manageServers,
            status: false,
            interval: 5 // in minutes
        },
    ];
    let counter = 0;
    while (true) {
        for (const func of functionList) {
            if (func.status && (!func['lastRun'] || (counter - func.lastRun > func.interval))) {
                ns.print("Running " + func.name);
                if (counter >= 1000 * 60 * 60 * 24)
                    func.lastRun = 0;
                else
                    func.lastRun = counter;
                await func.func(ns);
            }
        }
        counter++;
        if (counter >= 1000 * 60 * 60 * 24)
            counter = 0;
        await ns.sleep(1000 * 60);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zb3VyY2VzLyIsInNvdXJjZXMiOlsic2NoZWR1bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLEtBQUssVUFBVSxNQUFNLENBQUMsRUFBTTtJQUMzQixFQUFFLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQSxtQ0FBbUM7SUFDdkUsRUFBRSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFBO0FBQ25DLENBQUM7QUFFRCxLQUFLLFVBQVUsV0FBVyxDQUFDLEVBQU07SUFDaEMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxLQUFLLFVBQVUsT0FBTyxDQUFDLEVBQU07SUFDNUIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDLEVBQUcsWUFBWSxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUVELEtBQUssVUFBVSxhQUFhLENBQUMsRUFBTTtJQUNsQyxFQUFFLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFDekMsQ0FBQztBQVVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEVBQU07SUFHaEMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQixFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZCLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVyQixNQUFNLFlBQVksR0FBWTtRQUM3QjtZQUNDLElBQUksRUFBRSxRQUFRO1lBQ2QsSUFBSSxFQUFFLE1BQU07WUFDWixNQUFNLEVBQUUsS0FBSztZQUNiLFFBQVEsRUFBRSxFQUFFO1NBQ1o7UUFDRDtZQUNDLElBQUksRUFBRSxhQUFhO1lBQ25CLElBQUksRUFBRSxXQUFXO1lBQ2pCLE1BQU0sRUFBRSxLQUFLO1lBQ2IsUUFBUSxFQUFFLENBQUMsQ0FBQyxhQUFhO1NBQ3pCO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsU0FBUztZQUNmLElBQUksRUFBRSxPQUFPO1lBQ2IsTUFBTSxFQUFFLEtBQUs7WUFDYixRQUFRLEVBQUUsRUFBRSxDQUFDLGFBQWE7U0FDMUI7UUFDRDtZQUNDLElBQUksRUFBRSxlQUFlO1lBQ3JCLElBQUksRUFBRSxhQUFhO1lBQ25CLE1BQU0sRUFBRSxLQUFLO1lBQ2IsUUFBUSxFQUFFLENBQUMsQ0FBQyxhQUFhO1NBQ3pCO0tBQ0QsQ0FBQTtJQUVELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztJQUVoQixPQUFPLElBQUksRUFBRTtRQUVaLEtBQUssTUFBTSxJQUFJLElBQUksWUFBWSxFQUFFO1lBQ2hDLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFDLElBQUksQ0FBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7Z0JBQzdFLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsSUFBSSxPQUFPLElBQUUsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUMsRUFBRTtvQkFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQzs7b0JBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUM1QixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDcEI7U0FDRDtRQUVELE9BQU8sRUFBRSxDQUFDO1FBRVYsSUFBSSxPQUFPLElBQUUsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUMsRUFBRTtZQUFFLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFFeEMsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksR0FBQyxFQUFFLENBQUMsQ0FBQztLQUN4QjtBQUVGLENBQUMifQ==