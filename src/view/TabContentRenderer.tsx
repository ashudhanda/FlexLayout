import * as React from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { I18nLabel } from "./I18nLabel";
import { LayoutController, LayoutInternal } from "./layout/LayoutInternal";
import { TabNode } from "../model/TabNode";
import { CLASSES } from "./CSSClassNames";

/** props for {@link TabContentRenderer}; the memo comparator re-renders only when the tab is visible and a revision changed */
export interface ITabContentRenderProps {
    /** layout controller used to render the tab's component or sub-layout */
    controller: LayoutController;
    /** the tab whose content is rendered */
    tabNode: TabNode;
    /** id of the window (main or popout) the tab is currently shown in */
    windowId: string;
    /** false for hidden tabs, whose content stays mounted but skips re-rendering */
    visible: boolean;
    /** incremented whenever the whole layout must redraw */
    fullRedrawRevision: number;
    /** new object identity whenever the parent tabset must redraw */
    parentRedrawRevision: object;
}

export const TabContentRenderer = React.memo(({ controller, tabNode }: ITabContentRenderProps) => {
    TabContentRenderer.displayName = "TabContentRenderer"; // name in react dev tools

    let content;
    if (tabNode.getComponent()) {
        content = controller.getFactory()(tabNode);
    } else if (tabNode.getSubLayoutId()) {
        const model = tabNode.getModel();
        const subLayout = model.getLayouts().get(tabNode.getSubLayoutId()!)!;
        content = (
            <div className={controller.getClassName(CLASSES.FLEXLAYOUT__TAB_LAYOUT_CONTAINER)}>
                <LayoutInternal {...controller.getProps()} layoutId={tabNode.getSubLayoutId()} path={tabNode.getPath() + subLayout.getPath()} mainLayoutController={controller.getMainController()} />;
            </div>
        );
    }
    return (
        <ErrorBoundary message={controller.i18nName(I18nLabel.Error_rendering_component)} retryText={controller.i18nName(I18nLabel.Error_rendering_component_retry)}>
            {content}
        </ErrorBoundary>
    );
}, arePropsEqual);

// only re-render if visible && (fullRedrawRevision or parentRedrawRevision changed)
function arePropsEqual(prevProps: ITabContentRenderProps, nextProps: ITabContentRenderProps) {
    const reRender =
        nextProps.visible &&
        (prevProps.windowId !== nextProps.windowId ||
            prevProps.fullRedrawRevision !== nextProps.fullRedrawRevision ||
            prevProps.parentRedrawRevision !== nextProps.parentRedrawRevision ||
            prevProps.tabNode !== nextProps.tabNode || // node instance replaced (fromJson with a previous model)
            nextProps.tabNode.getSubLayoutId() !== undefined);
    return !reRender;
}
