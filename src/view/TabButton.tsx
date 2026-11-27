import * as React from "react";
import { I18nLabel } from "./I18nLabel";
import { Actions } from "../model/Actions";
import { TabNode } from "../model/TabNode";
import { TabSetNode } from "../model/TabSetNode";
import { TabGroupNode } from "../model/TabGroupNode";
import { LayoutController } from "./layout/LayoutInternal";
import { CLASSES } from "./CSSClassNames";
import {
    domId,
    focusAdjacentTabButton,
    focusTabContent,
    getRenderStateEx,
    handleRenameTextBoxKeyDown,
    handleTabCloseClick,
    hasModifier,
    isAuxMouseEvent,
    matchesKey,
    toAriaKeyShortcuts,
    useEndRenameOnOutsidePointerDown,
    useSelectRenameTextOnEdit,
} from "./Utils";

/** @internal */
export interface ITabButtonProps {
    controller: LayoutController;
    tabNode: TabNode;
    selected: boolean;
    path: string;
}

/** @internal */
export const TabButton = (props: ITabButtonProps) => {
    const { controller, tabNode, selected, path } = props;
    const selfRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLInputElement>(null);
    const icons = controller.getIcons();
    const keyMap = controller.getKeyMap();
    const editing = controller.getEditingTab() === tabNode;

    // callback ref: fires on attach/detach including remounts, unlike an effect
    const setSelfRef = React.useCallback(
        (element: HTMLDivElement | null) => {
            selfRef.current = element;
            controller.registerMeasurable(tabNode, "tabbutton", element);
        },
        [controller, tabNode],
    );

    useSelectRenameTextOnEdit(editing, contentRef);
    useEndRenameOnOutsidePointerDown(editing, controller, contentRef);

    const onDragStart = (event: React.DragEvent<HTMLElement>) => {
        if (tabNode.isEnableDrag()) {
            event.stopPropagation(); // prevent starting a tabset drag as well
            controller.getDragDropManager().setDragNode(event.nativeEvent, tabNode as TabNode);
        } else {
            event.preventDefault();
        }
    };

    const onDragEnd = (_event: React.DragEvent<HTMLElement>) => {
        controller.getDragDropManager().onDragEnded();
    };

    const onAuxMouseClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (isAuxMouseEvent(event)) {
            controller.auxMouseClick(tabNode, event);
        }
    };

    const onContextMenu = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        controller.showContextMenu(tabNode, event);
    };

    const onClick = () => {
        if (!tabNode.isSelected()) {
            controller.doAction(Actions.selectTab(tabNode.getId()));
        }
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (editing) {
            return; // the rename textbox handles its own keys
        }
        if (matchesKey(event, keyMap.focusTabToggle)) {
            // move focus into the tab content: the first focusable element, or the panel itself
            focusTabContent(tabNode, controller, selected, onClick, selfRef.current);
            event.preventDefault();
        } else if (event.key === "Enter" || event.key === " ") {
            if (selected) {
                focusTabContent(tabNode, controller, selected, onClick, selfRef.current); // activating an already selected tab enters its content
            } else {
                onClick();
            }
            event.preventDefault();
        } else if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && !hasModifier(event)) {
            focusAdjacentTabButton(selfRef.current, -1);
            event.preventDefault();
        } else if ((event.key === "ArrowRight" || event.key === "ArrowDown") && !hasModifier(event)) {
            focusAdjacentTabButton(selfRef.current, 1);
            event.preventDefault();
        } else if (matchesKey(event, keyMap.closeTab) && tabNode.isCloseable()) {
            focusAdjacentTabButton(selfRef.current, 1); // move focus to a neighbour before this tab is removed
            controller.doAction(Actions.deleteTab(tabNode.getId()));
            event.preventDefault();
        } else if (matchesKey(event, keyMap.renameTab) && tabNode.isEnableRename()) {
            onRename();
            event.preventDefault();
        }
    };

    const onDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (tabNode.isEnableRename()) {
            onRename();
            event.stopPropagation();
        }
    };

    const onRename = () => {
        controller.setEditingTab(tabNode);
    };

    const onClose = (event: React.MouseEvent<HTMLElement>) => {
        handleTabCloseClick(event, controller, tabNode, selected);
    };

    const onClosePointerDown = (event: React.PointerEvent<HTMLElement>) => {
        event.stopPropagation();
    };

    const onTextBoxPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
        event.stopPropagation();
    };

    const onTextBoxKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        handleRenameTextBoxKeyDown(event, controller, tabNode, selfRef.current);
    };

    const cm = controller.getClassName;
    const parentNode = tabNode.getTabContainer() as TabSetNode;
    const groupNode = tabNode.getParent() instanceof TabGroupNode ? (tabNode.getParent() as TabGroupNode) : undefined;

    const isStretch = parentNode.isEnableSingleTabStretch() && parentNode.getChildren().length === 1 && parentNode.getChildren()[0] === tabNode;
    const baseClassName = isStretch ? CLASSES.FLEXLAYOUT__TAB_BUTTON_STRETCH : CLASSES.FLEXLAYOUT__TAB_BUTTON;
    let classNames = cm(baseClassName);
    classNames += " " + cm(baseClassName + "_" + parentNode.getTabLocation());

    if (!isStretch) {
        if (selected) {
            classNames += " " + cm(baseClassName + "--selected");
        } else {
            classNames += " " + cm(baseClassName + "--unselected");
        }
    }

    if (tabNode.isPinned()) {
        classNames += " " + cm(baseClassName + "--pinned");
    }

    if (groupNode !== undefined) {
        classNames += " " + cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_GROUPED);
        if (tabNode.getModel().getTabGroupType() === "underline") {
            classNames += " " + cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_GROUPED_UNDERLINE);
        }
    }

    if (tabNode.getClassName() !== undefined) {
        classNames += " " + tabNode.getClassName();
    }

    const renderState = getRenderStateEx(controller, tabNode);

    // keep exactly one tab stop in the tablist even when the tabset has no selected tab
    const isTabbable = selected || (parentNode.getSelectedNode() === undefined && parentNode.getTabNodes()[0] === tabNode);

    // aria-keyshortcuts from the resolved keymap
    const ariaKeyshortcuts =
        [
            toAriaKeyShortcuts(keyMap.focusTabToggle),
            tabNode.isCloseable() ? toAriaKeyShortcuts(keyMap.closeTab) : undefined,
            tabNode.isEnableRename() ? toAriaKeyShortcuts(keyMap.renameTab) : undefined,
        ]
            .filter(Boolean)
            .join(" ") || undefined;

    let content = renderState.content ? <div className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_CONTENT)}>{renderState.content}</div> : null;

    const leading = renderState.leading ? <div className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_LEADING)}>{renderState.leading}</div> : null;

    if (editing) {
        content = (
            <input
                ref={contentRef}
                className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_TEXTBOX)}
                data-layout-path={path + "/textbox"}
                type="text"
                aria-label={controller.i18nName(I18nLabel.Rename_Tab)}
                autoFocus={true}
                defaultValue={tabNode.getName()}
                onKeyDown={onTextBoxKeyPress}
                onPointerDown={onTextBoxPointerDown}
            />
        );
    }

    if (tabNode.isPinned()) {
        const pinnedTitle = controller.i18nName(I18nLabel.Pinned_Tab);
        renderState.buttons.push(
            // the pinned state is conveyed to assistive technology via the tab's aria-label
            <div key="pin" data-layout-path={path + "/button/pin"} title={pinnedTitle} aria-hidden="true" className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_PIN)}>
                {typeof icons.pin === "function" ? icons.pin(tabNode) : icons.pin}
            </div>,
        );
    }

    if (tabNode.isCloseable() && !isStretch) {
        const closeTitle = controller.i18nName(I18nLabel.Close_Tab);
        renderState.buttons.push(
            // aria-hidden: pointer-only close button, not a tab stop (APG tabs pattern)
            <div
                key="close"
                data-layout-path={path + "/button/close"}
                title={closeTitle}
                aria-hidden="true"
                className={cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_TRAILING)}
                onPointerDown={onClosePointerDown}
                onClick={onClose}
            >
                {typeof icons.close === "function" ? icons.close(tabNode) : icons.close}
            </div>,
        );
    }

    const style: React.CSSProperties = {};
    if (groupNode !== undefined) {
        (style as Record<string, string>)["--flexlayout-group-color"] = groupNode.getColor();
    }

    return (
        <div
            ref={setSelfRef}
            id={domId("flexlayout-tabbutton-", tabNode.getId())}
            // drop tab role during rename (tab must not contain interactive children)
            role={editing ? undefined : "tab"}
            aria-selected={editing ? undefined : selected}
            aria-controls={editing ? undefined : domId("flexlayout-tab-", tabNode.getId())}
            // explicit name to exclude adornments from the accessible name
            aria-label={editing ? undefined : tabNode.isPinned() ? renderState.name + " (" + controller.i18nName(I18nLabel.Pinned_Tab) + ")" : renderState.name}
            aria-keyshortcuts={editing ? undefined : ariaKeyshortcuts}
            tabIndex={editing ? -1 : isTabbable ? 0 : -1}
            onKeyDown={onKeyDown}
            data-layout-path={path}
            className={classNames}
            style={style}
            onClick={onClick}
            onAuxClick={onAuxMouseClick}
            onContextMenu={onContextMenu}
            title={tabNode.getHelpText()}
            draggable={true}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDoubleClick={onDoubleClick}
        >
            {leading}
            {content}
            {renderState.buttons}
        </div>
    );
};

TabButton.displayName = "TabButton"; // name in react dev tools
