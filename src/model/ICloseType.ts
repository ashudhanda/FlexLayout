/** When the close ("x") button appears on a tab button or tabset header. */
export enum ICloseType {
    /** close if selected or hovered, i.e. when x is visible (will only close selected on mobile, where css hover is not available) */
    Visible = 1,
    /** close always (both selected and unselected when x rect tapped e.g where a custom image has been added for close) */
    Always = 2,
    /** close only if selected */
    Selected = 3,
}
