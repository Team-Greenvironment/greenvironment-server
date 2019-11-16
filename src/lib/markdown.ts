import * as MarkdownIt from "markdown-it/lib";
import globals from "./globals";

namespace markdown {

    const md = new MarkdownIt();

    for (const pluginName of globals.config.markdown.plugins) {
        try {
            const plugin = require(pluginName);
            if (plugin) {
                md.use(plugin);
            }
        } catch (err) {
            globals.logger.warn(`Markdown-it plugin '${pluginName}' not found!`);
        }
    }

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
