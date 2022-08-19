"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(src_exports);
var import_coc = require("coc.nvim");
var sourceName = "copilot";
var activate = async (context) => {
  context.subscriptions.push(
    import_coc.sources.createSource({
      name: sourceName,
      doComplete: async (option) => {
        const result = await getCompletionItems(option);
        return result;
      }
    })
  );
  import_coc.events.on("CompleteDone", async (item) => {
    var _a, _b;
    if (item.source !== sourceName) {
      return;
    }
    const firstLine = (_a = item.user_data) == null ? void 0 : _a.split("\n")[0];
    const currentLine = await import_coc.workspace.nvim.call("getline", ["."]);
    if (currentLine !== firstLine) {
      return;
    }
    const lines = (_b = item.user_data) == null ? void 0 : _b.split("\n");
    if (lines != null && lines[1] != null) {
      const lnum = await import_coc.workspace.nvim.call("line", ["."]);
      const appendLines = lines.slice(1);
      await import_coc.workspace.nvim.call("append", [lnum, appendLines]);
      await import_coc.workspace.nvim.call("setpos", [".", [0, lnum + appendLines.length, appendLines.slice(-1)[0].length + 1]]);
      await import_coc.workspace.nvim.command("redraw!");
    }
  });
};
var getCompletionItems = async (option) => {
  const buffer = import_coc.workspace.nvim.createBuffer(option.bufnr);
  const copilot = await buffer.getVar("_copilot");
  const filetype = await import_coc.workspace.nvim.call("getbufvar", ["", "&filetype"]);
  if ((copilot == null ? void 0 : copilot.suggestions) == null) {
    return {
      items: []
    };
  }
  return {
    items: copilot.suggestions.map(({ text }) => {
      var _a;
      const match = /^(?<indent>\s*).+/.exec(text);
      const indent = (_a = match == null ? void 0 : match.groups) == null ? void 0 : _a.indent;
      let info;
      if (indent != null) {
        info = text.split("\n").map((line) => line.slice(indent.length)).join("\n");
      } else {
        info = text;
      }
      return {
        word: text.split("\n")[0].slice(option.col),
        info,
        user_data: text,
        dup: 1,
        empty: 1,
        documentation: [{ filetype, content: info }]
      };
    })
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
