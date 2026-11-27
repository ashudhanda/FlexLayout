import * as React from "react";
import { I18nLabel } from "./I18nLabel";
import { Actions } from "../model/Actions";
import { TabNode } from "../model/TabNode";
import { BorderNode } from "../model/BorderNode";
import { TabGroupNode } from "../model/TabGroupNode";
import { IIcons } from "../view/layout/LayoutTypes";
import { LayoutController } from "../view/layout/LayoutInternal";
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
export interface IBorderButtonProps {
    controller: LayoutController;
    tabNode: TabNode;
    selected: boolean;
    border: string;
    icons: IIcons;
    path: string;
}

/** @internal */
export const BorderButton = (props: IBorderButtonProps) => {
    const { controller, tabNode, selected, border, icons, path } = props;
    const selfRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLInputElement>(null);
    const keyMap = controller.getKeyMap();

    const onDragStart = (event: React.DragEvent<HTMLElement>) => {
        if (tabNode.isEnableDrag()) {
            event.stopPropagation();
            controller.getDragDropManager().setDragNode(event.nativeEvent, tabNode as TabNode);
        } else {
            event.preventDefault();
        }
    };

    const onDragEnd = (event: React.DragEvent<HTMLElement>) => {
        event.stopPropagation();
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
        controller.doAction(Actions.selectTab(tabNode.getId()));
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (controller.getEditingTab() === tabNode) {
            return; // the rename textbox handles its own keys
        }
        if (matchesKey(event, keyMap.focusTabToggle)) {
            // move focus into the tab content: the first focusable element, or the panel itself
            focusTabContent(tabNode, controller, selected, onClick, selfRef.current);
            event.preventDefault();
        } else if (event.key === "Enter" || event.key === " ") {
            onClick();
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
        }
    };

    const onClose = (event: React.MouseEvent<HTMLElement>) => {
        handleTabCloseClick(event, controller, tabNode, selected);
    };

    const onClosePointerDown = (event: React.PointerEvent<HTMLElement>) => {
        event.stopPropagation();
    };

    // roving tabindex: the selected tab is tabbable; when a border has no selection its first tab is
    const isTabbable = () => {
        if (selected) {
            return true;
        }
        const tabset = tabNode.getTabContainer();
        return tabset instanceof BorderNode && tabset.getSelected() === -1 && tabset.getTabNodes()[0] === tabNode;
    };

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

    const onTextBoxPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
        event.stopPropagation();
    };

    const onTextBoxKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        handleRenameTextBoxKeyDown(event, controller, tabNode, selfRef.current);
    };

    const cm = controller.getClassName;
    let classNames = cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON_ + border);

    if (selected) {
        classNames += " " + cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON__SELECTED);
    } else {
        classNames += " " + cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON__UNSELECTED);
    }

    const groupNode = tabNode.getParent() instanceof TabGroupNode ? (tabNode.getParent() as TabGroupNode) : undefined;
    if (groupNode !== undefined) {
        classNames += " " + cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_GROUPED);
        if (tabNode.getModel().getTabGroupType() === "underline") {
            classNames += " " + cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_GROUPED_UNDERLINE);
        }
    }

    if (tabNode.getClassName() !== undefined) {
        classNames += " " + tabNode.getClassName();
    }

    let iconAngle = 0;
    if (tabNode.getModel().isEnableRotateBorderIcons() === false) {
        if (border === "left") {
            iconAngle = tabNode.getModel().getBorderLeftTabDirection() === "down" ? -90 : 90;
        } else if (border === "right") {
            iconAngle = -90;
        }
    }

    const renderState = getRenderStateEx(controller, tabNode, iconAngle);

    let content = renderState.content ? <div className={cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON_CONTENT)}>{renderState.content}</div> : null;

    const leading = renderState.leading ? <div className={cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON_LEADING)}>{renderState.leading}</div> : null;

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

    if (tabNode.isCloseable()) {
        const closeTitle = controller.i18nName(I18nLabel.Close_Tab);
        renderState.buttons.push(
            // aria-hidden: pointer-only close button, not a tab stop (APG tabs pattern)
            <div
                key="close"
                data-layout-path={path + "/button/close"}
                title={closeTitle}
                aria-hidden="true"
                className={cm(CLASSES.FLEXLAYOUT__BORDER_BUTTON_TRAILING)}
                onPointerDown={onClosePointerDown}
                onClick={onClose}
            >
                {typeof icons.close === "function" ? icons.close(tabNode) : icons.close}
            </div>,
        );
    }

    // aria-keyshortcuts from the resolved keymap
    const ariaKeyshortcuts = [toAriaKeyShortcuts(keyMap.focusTabToggle), tabNode.isCloseable() ? toAriaKeyShortcuts(keyMap.closeTab) : undefined].filter(Boolean).join(" ") || undefined;

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
            // explicit name to exclude the close button from the accessible name
            aria-label={editing ? undefined : renderState.name}
            aria-keyshortcuts={editing ? undefined : ariaKeyshortcuts}
            tabIndex={editing ? -1 : isTabbable() ? 0 : -1}
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
        >
            {leading}
            {content}
            {renderState.buttons}
        </div>
    );
};

BorderButton.displayName = "BorderButton"; // name in react dev tools
