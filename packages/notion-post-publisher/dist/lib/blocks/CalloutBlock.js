"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalloutBlock = exports.CalloutTypeMap = void 0;
const render_utils_1 = require("../../utils/render-utils");
exports.CalloutTypeMap = {
    "⚠️": "warning",
    "⚡": "tip",
    "📋": "tl;dr",
    "💡": "idea",
};
class CalloutBlock {
    constructor(params) {
        this.type = this.getType(params.callout.icon);
        this.text = (0, render_utils_1.renderRichText)(params.callout.rich_text) + "\n";
        // if (params.has_children && params.children && params.children.length > 0) {
        //   const childBlocks = (params.children ?? []).map((child) => {
        //     return Block.create(child);
        //   });
        //   const childText = childBlocks
        //     .map((block, idx) => {
        //       return block.render() + trailingNewlines(childBlocks, idx);
        //     })
        //     .join("");
        //   this.text += `\n${childText}`;
        // }
    }
    /**
     * Determines the type for the callout, following the emoji map at the top of
     * this file. Default is `note`.
     *
     * @param icon Icon object from Notion response
     * @returns String to use as the callout type
     */
    getType(icon) {
        if (icon &&
            icon.type === "emoji" &&
            Object.keys(exports.CalloutTypeMap).includes(icon.emoji)) {
            return exports.CalloutTypeMap[icon.emoji];
        }
        return "note";
    }
    render() {
        return `{% callout type="${this.type}" %}\n${this.text}{% endcallout %}`;
    }
}
exports.CalloutBlock = CalloutBlock;
