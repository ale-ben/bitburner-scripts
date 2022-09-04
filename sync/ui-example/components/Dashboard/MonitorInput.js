import { getAllServers } from "/ui-example/utils/getAllServers";
const cheatyWindow = eval("window");
const cheatyDocument = eval("document");
const React = cheatyWindow.React;
const { useState, useMemo } = React;
// This module lets you monitor a server's details (money, security, required threads for grow,weaken,hack etc).
//It has a primitive auto - complete feature. Suggestions for server names will appear as you start typing.When there is 1 suggestion left pressing Enter will run a monitor for that server.
export const MonitorInput = ({ ns }) => {
    const allServers = useMemo(() => getAllServers(ns), []);
    const [suggestions, setSuggestions] = useState([]);
    const onChangeHandler = (e) => {
        const query = e.target.value;
        const matchedServers = [];
        for (const server of allServers) {
            if (queryInString(query, server)) {
                matchedServers.push(server);
            }
        }
        setSuggestions(e.target.value === "" ? [] : matchedServers);
    };
    const onKeyDownHandler = async (e) => {
        if (e.key === "Enter") {
            if (suggestions.length === 1) {
                ns.run("/utils/monitor.js", 1, suggestions[0]);
                setSuggestions([]);
                e.target.value = "";
            }
        }
    };
    const onFocusHandler = () => {
        const terminalInput = cheatyDocument.getElementById("terminal-input");
        if (terminalInput)
            terminalInput.disabled = true;
    };
    const onFocusOut = () => {
        const terminalInput = cheatyDocument.getElementById("terminal-input");
        if (terminalInput)
            terminalInput.disabled = false;
    };
    const suggestionsSection = suggestions.map((server) => {
        return React.createElement("div", { key: server }, server);
    });
    return (React.createElement("div", { style: {
            fontFamily: "Consolas",
            fontSize: "12px",
        } },
        React.createElement("input", { style: {
                width: "100px",
                height: "20px",
                border: "1px solid yellow",
                padding: "2px",
                backgroundColor: "black",
                color: "yellow",
                margin: "2px",
            }, placeholder: "Monitor", onChange: onChangeHandler, onKeyDown: onKeyDownHandler, onFocusCapture: onFocusHandler, onBlur: onFocusOut }),
        React.createElement("div", { style: {
                position: "relative",
                width: "60px",
                bottom: "0px",
                background: "#00000092",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                zIndex: "9999",
            } }, suggestions.length > 0 ? suggestionsSection : null)));
};
function queryInString(query, string) {
    return string.toLowerCase().includes(query.toLowerCase());
}
