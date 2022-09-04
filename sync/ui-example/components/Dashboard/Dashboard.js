import { Button } from "/ui-example/components/Button";
import { MonitorInput } from "/ui-example/components/Dashboard/MonitorInput";
import { ToggleSection } from "/ui-example/components/Dashboard/ToggleSection";
const cheatyWindow = eval("window");
const React = cheatyWindow.React;
export const Dashboard = ({ ns }) => {
    const killAllClicked = async () => {
        alert("Killing stuff");
    };
    const runClicked = async () => {
        alert("Running stuff");
    };
    return (React.createElement("div", { style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
        } },
        React.createElement("div", { style: {
                display: "flex",
                flexDirection: "row",
            } },
            React.createElement(Button, { bg: "red", title: "Kill All!", onButtonClick: killAllClicked }),
            React.createElement(Button, { bg: "green", title: "Run!", onButtonClick: runClicked })),
        React.createElement(MonitorInput, { ns: ns }),
        React.createElement(ToggleSection, { ns: ns })));
};
