import * as React from "react";
import { TabNode } from "../src";

/**
 * Live tab inspector for the demo: renders the selected tab's serialized JSON,
 * path, layout/window ids, closability, and current rect as preformatted text.
 * A 500ms interval forces a re-render so the values stay current while the
 * user drags, resizes, or edits the tab.
 */
export function TabProperties({ node }: { node: TabNode }) {
    const [, setValue] = React.useState<number>(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setValue((v) => v + 1);
        }, 500);
        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <pre className="tab_content" style={{ display: "block", padding: "5px" }}>
            {"Attributes: " +
                JSON.stringify(node.toJson(), null, "  ") +
                "\n\nPath: " +
                node.getPath() +
                "\n\nLayoutId: " +
                node.getLayoutId() +
                "\n\nWindowId: " +
                node.getWindowId() +
                "\n\nClosable: " +
                node.isCloseable() +
                "\n\nAllowed in Window: " +
                node.isAllowedInWindow() +
                "\n\nRect: " +
                JSON.stringify(node.getRect(), null, "  ")}
        </pre>
    );
}
