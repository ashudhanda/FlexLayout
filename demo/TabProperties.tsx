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
            {`Attributes: ${JSON.stringify(node.toJson(), null, "  ")}

Path: ${node.getPath()}

LayoutId: ${node.getLayoutId()}

WindowId: ${node.getWindowId()}

Closable: ${node.isCloseable()}

Allowed in Window: ${node.isAllowedInWindow()}

Rect: ${JSON.stringify(node.getRect(), null, "  ")}`}
        </pre>
    );
}
