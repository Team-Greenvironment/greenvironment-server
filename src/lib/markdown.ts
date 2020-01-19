import * as MarkdownIt from "markdown-it/lib";

const { html5Media } = require("markdown-it-html5-media");
const mdEmoji = require("markdown-it-emoji");

namespace markdown {

    const md = new MarkdownIt()
        .use(html5Media)
        .use(mdEmoji);

    /**
     * Renders the markdown string inline (without blocks).
     * @param markdownString
     */
    export function renderInline(markdownString: string): string {
        return md.renderInline(markdownString);
    }

    /**
     * Renders the markdown string.
     * @param markdownString
     */
    export function render(markdownString: string): string {
        return md.render(markdownString);
    }
}

export default markdown;
