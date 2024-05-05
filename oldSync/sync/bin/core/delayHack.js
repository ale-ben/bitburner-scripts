export async function main(ns) {
    const hostname = ns.args[0];
    if (!hostname) {
        throw new Error("No hostname specified.");
    }
    if (typeof hostname !== "string") {
        throw new Error("Hostname must be a string.");
    }
    const delayMS = ns.args[1];
    if (!delayMS) {
        throw new Error("No delay specified.");
    }
    if (typeof delayMS !== "number") {
        throw new Error("Delay must be a number.");
    }
    await ns.sleep(delayMS);
    await ns.hack(hostname);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsYXlIYWNrLmpzIiwic291cmNlUm9vdCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zb3VyY2VzLyIsInNvdXJjZXMiOlsiY29tcGxldGUvYmluL2NvcmUvZGVsYXlIYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE1BQU0sQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEVBQU87SUFDakMsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7UUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0tBQzlDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7UUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hCLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6QixDQUFDIn0=