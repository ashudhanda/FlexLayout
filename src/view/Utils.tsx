import * as React from "react";
import { Node } from "../model/Node";
import { TabNode } from "../model/TabNode";
import { LayoutController } from "./layout/LayoutInternal";
import { ModelLayout } from "../model/ModelLayout";
import { defaultKeyMap, IKeyMap } from "./layout/LayoutTypes";

/** @internal true when the primary input supports hover (fine pointer); gates
 * hover-only affordances such as tooltips that have no touch equivalent */
export function isDesktop() {
    const desktop = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return desktop;
}
/** @internal
 * Assemble the render state for a tab button: leading (icon), content/title and
 * buttons. The controller's `customizeTab` hook may override any of them; the
 * resolved name is pushed back into the node so overflow menus stay in sync. */
export function getRenderStateEx(controller: LayoutController, tabNode: TabNode, iconAngle?: number) {
    let leadingContent = undefined;
    const titleContent: React.ReactNode = tabNode.getName();
    const name = tabNode.getName();
    if (iconAngle === undefined) {
        iconAngle = 0;
    }

    if (leadingContent === undefined && tabNode.getIcon() !== undefined) {
        // alt is empty since the icon is decorative, the tab name is in the adjacent content
        if (iconAngle !== 0) {
            leadingContent = <img style={{ width: "1em", height: "1em", transform: "rotate(" + iconAngle + "deg)" }} src={tabNode.getIcon()} alt="" />;
        } else {
            leadingContent = <img style={{ width: "1em", height: "1em" }} src={tabNode.getIcon()} alt="" />;
        }
    }

    const buttons: React.ReactNode[] = [];

    // allow customization of leading contents (icon) and contents
    const renderState = { leading: leadingContent, content: titleContent, name, buttons };
    controller.customizeTab(tabNode, renderState);

    tabNode.setRenderedName(renderState.name);

    return renderState;
}

/** @internal */
export function domId(prefix: string, nodeId: string) {
    return prefix + nodeId.replace(/\s/g, "_"); // aria id references cannot contain whitespace
}

/** @internal the modifier/key fields shared by native and React keyboard events */
export interface IKeyEventLike {
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

/** @internal
 * Test a key event against a binding spec like "ctrl+shift+x". Modifier order
 * is ignored, comparison is case-insensitive, and every modifier must match
 * exactly (an unlisted modifier held down fails the match). */
export function matchesKey(event: IKeyEventLike, spec: string | undefined): boolean {
    if (!spec) {
        return false;
    }
    const parts = spec.split("+");
    const key = parts.pop()!;
    const has = (mod: string) => parts.some((p) => p.toLowerCase() === mod);
    return event.key.toLowerCase() === key.toLowerCase() && event.ctrlKey === has("ctrl") && event.shiftKey === has("shift") && event.altKey === has("alt") && event.metaKey === has("meta");
}

/** @internal true when any modifier key is held; the fixed ARIA pattern keys (arrows on tabs and
 * splitters) only apply unmodified, so modified presses stay available for keymap bindings */
export function hasModifier(event: IKeyEventLike): boolean {
    return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
}

/** @internal merge the configured bindings over the defaults; a binding passed as an explicit
 * undefined disables that shortcut */
export function resolveKeyMap(keyMap: IKeyMap | undefined): IKeyMap {
    return { ...defaultKeyMap, ...keyMap };
}

/** @internal */
export function toAriaKeyShortcuts(spec: string | undefined) {
    return spec?.replace(/\bctrl\b/i, "Control"); // the aria-keyshortcuts attribute spells it "Control"
}

/** @internal focus the first focusable element inside `container`, falling back to
 * the container itself when it has none (containers carry tabindex for this) */
export function focusFirstIn(container: HTMLElement | null) {
    if (container) {
        const focusable = container.querySelector(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement | null;
        (focusable ?? container).focus();
    }
}

/** @internal */
export function isAuxMouseEvent(event: React.MouseEvent<HTMLElement, MouseEvent> | React.TouchEvent<HTMLElement>) {
    let auxEvent = false;
    if (event.nativeEvent instanceof MouseEvent) {
        if (event.nativeEvent.button !== 0 || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
            auxEvent = true;
        }
    }
    return auxEvent;
}

/** @internal Toggle pointer-events on embedded iframes/webviews in `currentDocument` so
 * that drag gestures pass through during a resize or drag operation. */
export function enablePointerOnIFrames(enable: boolean, currentDocument: Document) {
    const iframes = [...getElementsByTagName("iframe", currentDocument), ...getElementsByTagName("webview", currentDocument)];

    for (const iframe of iframes) {
        (iframe as HTMLElement).style.pointerEvents = enable ? "auto" : "none";
    }
}

/** @internal Snapshot of a DOM `getElementsByTagName` result as a plain array (safe to mutate). */
export function getElementsByTagName(tag: string, currentDocument: Document): Element[] {
    return [...currentDocument.getElementsByTagName(tag)];
}

export let Utils_dragging: boolean = false;

/** @internal Track a pointer drag on `doc`: routes pointermove to `drag(x, y)` and invokes
 * `dragEnd` on pointerup or `dragCancel` on pointercancel, cleaning up all listeners. */
export function startDrag(doc: Document, event: React.PointerEvent<HTMLElement>, drag: (x: number, y: number) => void, dragEnd: () => void, dragCancel: () => void) {
    Utils_dragging = true;
    event.preventDefault();

    const pointerMove = (ev: PointerEvent) => {
        ev.preventDefault();
        drag(ev.clientX, ev.clientY);
    };

    const removeListeners = () => {
        doc.removeEventListener("pointermove", pointerMove);
        doc.removeEventListener("pointerup", pointerUp);
        doc.removeEventListener("pointercancel", pointerCancel);
    };

    const pointerCancel = (ev: PointerEvent) => {
        ev.preventDefault();
        removeListeners();
        Utils_dragging = false;
        dragCancel();
    };
    const pointerUp = () => {
        removeListeners();
        Utils_dragging = false;
        dragEnd();
    };

    doc.addEventListener("pointermove", pointerMove);
    doc.addEventListener("pointerup", pointerUp);
    doc.addEventListener("pointercancel", pointerCancel);
}

/** @internal Find the layout hosting the tab whose sublayout is `layout`, if any. */
export function findParentLayout(layout: ModelLayout): ModelLayout | undefined {
    let parentLayout: ModelLayout | undefined = undefined;
    const model = layout.getController()!.getModel();
    model.visitNodes((node) => {
        if (node instanceof TabNode && node.getSubLayoutId() === layout.getLayoutId()) {
            parentLayout = node.getLayout();
        }
    });
    return parentLayout;
}

/** @internal Whether `node` may be docked into `layout`: window/float layouts are always OK,
 * a tab sublayout rejects nodes that carry their own sublayout, and window-backed tabs
 * reject nodes that are not allowed in windows. */
export function canDockToLayout(node: Node, layout: ModelLayout) {
    const type = layout.getType();
    if (type === "window") {
        return node.isAllowedInWindow();
    } else if (type === "float") {
        return true;
    } else if (type === "tab") {
        const parentLayout = findParentLayout(layout);
        if (parentLayout && parentLayout.getType() === "window" && !parentLayout.isMainLayout() && !node.isAllowedInWindow()) {
            return false;
        }
        // a tab sublayout cannot host tabs (or rows of tabs) that carry their own sublayout
        if (containsTabSublayout(node)) {
            return false;
        }
        return true;
    }
    return false;
}

function containsTabSublayout(node: Node): boolean {
    if (node instanceof TabNode) {
        return node.getSubLayoutId() !== undefined;
    }
    return node.getChildren().some((child) => containsTabSublayout(child));
}

/** @internal Copy the inline style attribute from `source` to `target`; returns true when it changed. */
export function copyInlineStyles(source: HTMLElement, target: HTMLElement): boolean {
    const sourceStyle = source.getAttribute("style");
    const targetStyle = target.getAttribute("style");
    if (sourceStyle === targetStyle) return false;

    if (sourceStyle) {
        target.setAttribute("style", sourceStyle);
    } else {
        target.removeAttribute("style");
    }
    return true;
}

/** @internal True on genuine Safari (user agent contains "Safari" but neither "Chrome" nor "Chromium"). */
export function isSafari() {
    const userAgent = navigator.userAgent;
    return userAgent.includes("Safari") && !userAgent.includes("Chrome") && !userAgent.includes("Chromium");
}

/** @internal Scroll offsets plus full-document and viewport dimensions for `win` (defaults to window). */
export function getPageMetrics(win: Window = window) {
    const document = win.document;
    return {
        scrollTop: win.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
        scrollLeft: win.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
        fullHeight: Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight,
        ),

        fullWidth: Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth,
            document.body.clientWidth,
            document.documentElement.clientWidth,
        ),

        viewportHeight: win.innerHeight || document.documentElement.clientHeight,
        viewportWidth: win.innerWidth || document.documentElement.clientWidth,
    };
}
