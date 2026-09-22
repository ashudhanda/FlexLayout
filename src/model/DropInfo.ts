import { DockLocation } from "./DockLocation";
import { IDropTarget } from "./IDropTarget";
import { Node } from "./Node";
import { Rect } from "./Rect";

/** Payload describing a candidate drop found during a drag: the target node, its dock preview rect, the dock zone and the insertion index. */
export class DropInfo {
    /** The node the pointer is over (must accept drops). */
    node: Node & IDropTarget;
    /** The dock preview highlight rectangle, in screen coordinates. */
    rect: Rect;
    /** Which zone of the target the pointer is in (TOP/BOTTOM/LEFT/RIGHT/CENTER). */
    location: DockLocation;
    /** Index at which the dragged item would be inserted in the target. */
    index: number;
    /** CSS class used to render the dock preview outline. */
    className: string;

    constructor(node: Node & IDropTarget, rect: Rect, location: DockLocation, index: number, className: string) {
        this.node = node;
        this.rect = rect;
        this.location = location;
        this.index = index;
        this.className = className;
    }
}
