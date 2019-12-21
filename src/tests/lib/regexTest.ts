import {expect} from "chai";
import {describe, it} from "mocha";
import {is} from "../../lib/regex";

describe("regex", () => {
    describe("email", () => {
        it("identifies right emails", () => {
            const result = is.email("trivernis@mail.com");
            expect(result).to.equal(true);
        });
        it("identifies non-email urls", () => {
            const result = is.email("notanemail.com");
            expect(result).to.equal(false);
        });
        it("identifies malformed emails", () => {
            const result = is.email("trivernis@mail.");
            expect(result).to.equal(false);
        });
    });
});
