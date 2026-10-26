/** @internal Contract for model nodes that can be dragged: whether dragging is currently enabled, and the display name shown while dragging. */
export interface IDraggable {
    /** @internal */
    isEnableDrag(): boolean;
    /** @internal */
    getName(): string | undefined;
}
