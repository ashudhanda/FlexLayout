/** Split orientation of a row/tabset container: HORZ stacks children in a row, VERT in a column. */
export class Orientation {
    /** Horizontal: children laid out left-to-right. */
    static HORZ = new Orientation("horz");
    /** Vertical: children laid out top-to-bottom. */
    static VERT = new Orientation("vert");

    /** The opposite orientation (used when nesting rows inside rows). */
    static flip(from: Orientation) {
        return from === Orientation.HORZ ? Orientation.VERT : Orientation.HORZ;
    }

    /** @internal */
    private _name: string;

    /** @internal */
    private constructor(name: string) {
        this._name = name;
    }

    /** The serialized name of this orientation ("horz" or "vert"), used in model JSON. */
    getName() {
        return this._name;
    }

    /** Same as getName(): the serialized name ("horz" or "vert"). */
    toString() {
        return this._name;
    }
}
