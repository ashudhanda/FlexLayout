import * as React from "react";

/**
 * Demo tab proving component state survives being moved between hosts: the
 * ticking counter and the form inputs keep their values when this tab is
 * popped out into a separate window or dragged into another tabset.
 */
export function SimpleForm() {
    const [value, setValue] = React.useState<number>(0);

    const [formData, setFormData] = React.useState({
        username: "",
        password: "",
    });

    // ticking counter: the interval keeps running across tab moves, so watching
    // this number proves component state survives pop-outs and drags
    React.useEffect(() => {
        const timer = setInterval(() => {
            setValue((v) => v + 1);
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const handleChange = (event: { target: { name: any; value: any } }) => {
        const { name, value } = event.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (event: { preventDefault: () => void }) => {
        event.preventDefault();
    };

    return (
        <div
            style={{
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                overflow: "auto",
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <p>See that the form keeps state when popped out</p>
            <form style={{ display: "flex", flexDirection: "column", gap: 10 }} onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input type="text" name="username" autoComplete="username" value={formData.username} onChange={handleChange} />
                </label>
                <label>
                    Password:
                    <input type="password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} />
                </label>
                <div>{value}</div>
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
}
