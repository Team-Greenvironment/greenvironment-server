import {expect} from "chai";
import {describe, it} from "mocha";
import markdown from "../../lib/markdown";

describe("markdown", () => {
    describe("renderInline", () => {
        it("renders markdown inline expressions", () => {
            const result = markdown.renderInline("**Hello**");
            expect(result).to.equal("<strong>Hello</strong>");
        });
        it("renders markdown emoji", () => {
           const result = markdown.renderInline(":smile:");
           expect(result).to.equal("😄");
        });
    });
    describe("render", () => {
        it("renders markdown block expressions", () => {
            const result = markdown.render("#header\n```\n```");
            expect(result).to.equal("<p>#header</p>\n<pre><code></code></pre>\n");
        });
        it("renders markdown emoji", () => {
           const result = markdown.render(":smile:");
           expect(result).to.equal("<p>😄</p>\n");
        });
    });
});
