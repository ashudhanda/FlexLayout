import { LayoutController } from "./layout/LayoutInternal";
import { CLASSES } from "./CSSClassNames";

/** @internal */
export interface IOverlayProps {
    controller: LayoutController;
    show: boolean;
}

/** @internal */
export const Overlay = (props: IOverlayProps) => {
    const { controller, show } = props;

    return (
        <div
            aria-hidden="true"
            className={controller.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_OVERLAY)}
            style={{
                display: show ? "flex" : "none",
            }}
        />
    );
};

Overlay.displayName = "Overlay"; // name in react dev tools
