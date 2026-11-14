// @vitest-environment node
import { miniScrollThumbSize, scrollPositionToThumb, thumbToScrollPosition } from "../src/view/TabOverflowHook";

describe("miniScrollThumbSize", () => {
    it("scales with the visible fraction of the content", () => {
        // 100px strip of 400px content -> 25px thumb
        expect(miniScrollThumbSize(100, 400)).equal(25);
    });

    it("never shrinks below the 20px minimum", () => {
        expect(miniScrollThumbSize(100, 1000)).equal(20);
    });

    it("is 0 without content to scroll", () => {
        expect(miniScrollThumbSize(100, 0)).equal(0);
    });
});

describe("scrollPositionToThumb / thumbToScrollPosition", () => {
    it("maps scroll position to the thumb and back (unclamped thumb)", () => {
        // 100px strip, 400px content, 25px thumb, max scroll 300, track 75
        expect(scrollPositionToThumb(0, 100, 400)).equal(0);
        expect(scrollPositionToThumb(150, 100, 400)).equal(37.5);
        expect(scrollPositionToThumb(300, 100, 400)).equal(75);
        expect(thumbToScrollPosition(0, 100, 400)).equal(0);
        expect(thumbToScrollPosition(37.5, 100, 400)).equal(150);
        expect(thumbToScrollPosition(75, 100, 400)).equal(300);
    });

    it("maps scroll position to the thumb and back (minimum-size thumb)", () => {
        // 100px strip, 1000px content, thumb clamped to 20px, max scroll 900, track 80
        expect(scrollPositionToThumb(900, 100, 1000)).equal(80);
        expect(scrollPositionToThumb(450, 100, 1000)).equal(40);
        expect(thumbToScrollPosition(80, 100, 1000)).equal(900);
        expect(thumbToScrollPosition(40, 100, 1000)).equal(450);
    });

    it("round-trips every scroll position through the thumb", () => {
        for (const position of [0, 1, 37, 123, 299, 300]) {
            expect(thumbToScrollPosition(scrollPositionToThumb(position, 100, 400), 100, 400)).toBeCloseTo(position, 9);
        }
        for (const position of [0, 1, 111, 450, 899, 900]) {
            expect(thumbToScrollPosition(scrollPositionToThumb(position, 100, 1000), 100, 1000)).toBeCloseTo(position, 9);
        }
    });

    it("clamps a thumb dragged past the track to the end of the content", () => {
        // dragging 500px past the track end must not overshoot the max scroll (900)
        expect(thumbToScrollPosition(500, 100, 1000)).equal(900);
        expect(thumbToScrollPosition(-50, 100, 1000)).equal(0);
    });

    it("is 0 when there is nothing to scroll", () => {
        expect(scrollPositionToThumb(0, 100, 100)).equal(0);
        expect(thumbToScrollPosition(10, 100, 100)).equal(0);
        expect(scrollPositionToThumb(0, 100, 50)).equal(0);
    });
});
