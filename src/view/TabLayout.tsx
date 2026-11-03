import { TabNode } from "../model/TabNode";
import { CLASSES } from "./CSSClassNames";
import { LayoutInternal } from "./layout/LayoutInternal";

export interface ITabLayoutProps {
    tabNode: TabNode;
}
/**
 * Component that can be used within the factory to render a tabs defined sublayout.
 * This allows the sublayout to be surrounded by other controls, e.g. a header and footer bars
 *
 * @category Components
 * @group Main Layout
 */
export const TabLayout = (props: ITabLayoutProps) => {
    const { tabNode } = props;

    const layout = tabNode.getLayout();
    const controller = layout.getController();

    // render nothing (null, not undefined) when the tab has no live controller or
    // its sublayout is not in the model, instead of crashing on the lookups below
    if (!controller) return null;

    const model = tabNode.getModel();
    const subLayout = model.getLayouts().get(tabNode.getSubLayoutId()!);
    if (!subLayout) return null;
    return (
        <div className={controller.getClassName(CLASSES.FLEXLAYOUT__TAB_LAYOUT_CONTAINER_USER)}>
            <LayoutInternal {...controller.getProps()} layoutId={tabNode.getSubLayoutId()} path={tabNode.getPath() + subLayout.getPath()} mainLayoutController={controller.getMainController()} />;
        </div>
    );
};
