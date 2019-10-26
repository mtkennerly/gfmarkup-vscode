import expect from "expect";
import * as etc from "../../src/etc";

describe("etc", () => {
    describe("fromUndefined", () => {
        it("returns the value when it is not undefined", () => {
            expect(etc.fromUndefined(undefined, "foo")).toBe("foo");
        });

        it("returns the fallback when the value is undefined", () => {
            expect(etc.fromUndefined(<any>"foo", "bar")).toBe("foo");
        });
    });
});
