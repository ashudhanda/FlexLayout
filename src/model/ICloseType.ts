/** When the close ("x") button appears on a tab button or tabset header. */
export enum ICloseType {
    /** Close if selected or hovered, i.e. when the close button is visible (on mobile, where CSS hover is not available, it only closes the selected tab). */
    Visible = 1,
    /** Close always (both selected and unselected, e.g. when the close rect is tapped where a custom close image has been added). */
    Always = 2,
    /** Close only if selected. */
    Selected = 3,
}
