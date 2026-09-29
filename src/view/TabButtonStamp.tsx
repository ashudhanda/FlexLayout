import { TabNode } from "../model/TabNode";
import { LayoutController } from "./layout/LayoutInternal";
import { CLASSES } from "./CSSClassNames";
import { getRenderStateEx } from "./Utils";

/** @internal */
export interface ITabButtonStampProps {
    tabNode: TabNode;
    controller: LayoutController;
}

/**
 * @internal
 * Static preview of a tab rendered inside the drag rectangle (see DragTabButton).
 * It is deliberately cheap to render: it reuses the overflow-menu rendering
 * rather than mounting a full interactive TabButton, and it never moves again
 * while the drag is in progress.
 */
export const TabButtonStamp = (props: ITabButtonStampProps) => {
    const { controller, tabNode } = props;

    const cm = controller.getClassName;

    const classNames = cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_STAMP);

    const renderState = getRenderStateEx(controller, tabNode);

    const content = renderState.content ? <div className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_CONTENT)}>{renderState.content}</div> : tabNode.getNameForOverflowMenu();

    const leading = renderState.leading ? <div className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_LEADING)}>{renderState.leading}</div> : null;

    return (
        <div className={classNames} title={tabNode.getHelpText()}>
            {leading}
            {content}
        </div>
    );
};

TabButtonStamp.displayName = "TabButtonStamp"; // name in react dev tools
