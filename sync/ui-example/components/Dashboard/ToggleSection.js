import { Switch } from "/ui-example/components/Switch";
const cheatyWindow = eval("window");
const React = cheatyWindow.React;
const { useState } = React;
export const ToggleSection = ({ ns }) => {
    const [hackActive, setHackActive] = useState(false);
    const [workActive, setWorkActive] = useState(true);
    const [sleepActive, setSleepActive] = useState(false);
    const [repeatActive, setRepeatActive] = useState(true);
    return (React.createElement("div", { style: {
            width: "100px",
            display: "flex",
            flexDirection: "column",
            margin: "4px 0px",
            padding: "2px",
            textAlign: "center",
        } },
        React.createElement("h4", { style: { marginBottom: "5px" } }, "Switches"),
        React.createElement(Switch, { title: "Hack", onClickHandler: () => {
                setHackActive(!hackActive);
            }, active: hackActive }),
        React.createElement(Switch, { title: "Work", onClickHandler: () => {
                setWorkActive(!workActive);
            }, active: workActive }),
        React.createElement(Switch, { title: "Sleep", onClickHandler: () => {
                setSleepActive(!sleepActive);
            }, active: sleepActive }),
        React.createElement(Switch, { title: "Sleep", onClickHandler: () => {
                setRepeatActive(!repeatActive);
            }, active: repeatActive })));
};
