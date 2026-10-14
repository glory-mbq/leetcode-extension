const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

function loadWithVscode(relativePath, vscode) {
  const filename = path.resolve(__dirname, "../out/src", relativePath);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const normalRequire = loaded.require.bind(loaded);
  loaded.require = (name) => name === "vscode" ? vscode : normalRequire(name);
  loaded._compile(fs.readFileSync(filename, "utf8"), filename);
  return loaded.exports;
}

function createVscode(settings = {}) {
  const calls = [];
  const vscode = {
    ViewColumn: { One: 1, Two: 2 },
    workspace: { getConfiguration: () => ({ get: (key, fallback) => settings[key] ?? fallback }) },
    Uri: { parse: (url) => url },
    env: { openExternal: async (url) => { calls.push(["external", url]); return true; } },
    commands: {
      getCommands: async () => ["workbench.action.browser.open"],
      executeCommand: async (...args) => { calls.push(args); },
    },
    window: {
      showWarningMessage: async (...args) => { calls.push(["warning", ...args]); },
      showErrorMessage: async (...args) => { calls.push(["error", ...args]); },
    },
  };
  return { vscode, calls };
}

test("default side mode puts code on the right and content on the left", () => {
  const { vscode } = createVscode();
  const { getProblemColumns } = loadWithVscode("utils/EditorLayout.js", vscode);
  assert.deepEqual(getProblemColumns(true), { code: 2, content: 1 });
});

test("the previous layout remains selectable", () => {
  const { vscode } = createVscode({ "editor.codePosition": "left" });
  const { getProblemColumns } = loadWithVscode("utils/EditorLayout.js", vscode);
  assert.deepEqual(getProblemColumns(true), { code: 1, content: 2 });
});

test("disabled side mode never creates a second group for code", () => {
  const { vscode } = createVscode({ "editor.codePosition": "right" });
  const { getProblemColumns } = loadWithVscode("utils/EditorLayout.js", vscode);
  assert.deepEqual(getProblemColumns(false), { code: 1, content: 1 });
});

const { getProblemPageUrl } = loadWithVscode("service/ProblemPageService.js", createVscode().vscode);

test("Chinese discussion uses the comments page", () => {
  assert.equal(getProblemPageUrl("https://leetcode.cn/problems/two-sum/description/", "discussion"),
    "https://leetcode.cn/problems/two-sum/comments/");
});

test("both endpoints use the current solutions page", () => {
  for (const host of ["leetcode.cn", "leetcode.com"]) {
    assert.equal(getProblemPageUrl(`https://${host}/problems/two-sum/description/`, "solution"),
      `https://${host}/problems/two-sum/solutions/`);
  }
});

test("root problem URLs and query strings do not retain the description page", () => {
  for (const suffix of ["", "/", "/description/?envType=study-plan#example"]) {
    assert.equal(getProblemPageUrl(`https://leetcode.cn/problems/two-sum${suffix}`, "solution"),
      "https://leetcode.cn/problems/two-sum/solutions/");
  }
});

test("legacy Chinese host upgrades to leetcode.cn", () => {
  assert.equal(getProblemPageUrl("https://leetcode-cn.com/problems/lcp-01/description/", "solution"),
    "https://leetcode.cn/problems/lcp-01/solutions/");
});

test("international discussion retains the votes sort parameters", () => {
  assert.equal(getProblemPageUrl("https://leetcode.com/problems/two-sum/", "discussion"),
    "https://leetcode.com/problems/two-sum/discuss/?currentPage=1&orderBy=most_votes&query=");
});

test("non-problem and foreign URLs cannot be turned into browser links", () => {
  for (const url of ["https://example.com/problems/two-sum/", "http://leetcode.cn/problems/two-sum/",
    "https://leetcode.cn/discuss/", "https://user:password@leetcode.cn/problems/two-sum/"]) {
    assert.throws(() => getProblemPageUrl(url, "discussion"), /Invalid LeetCode/);
  }
});

test("integrated browser opens the requested URL in the content group", async () => {
  const { vscode, calls } = createVscode();
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.cn/problems/two-sum/comments/", 1);
  assert.deepEqual(calls, [
    ["workbench.action.focusFirstEditorGroup"],
    ["workbench.action.browser.open", "https://leetcode.cn/problems/two-sum/comments/"],
  ]);
});

test("the reversed layout opens browser content in the second group", async () => {
  const { vscode, calls } = createVscode();
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.com/problems/two-sum/solutions/", 2);
  assert.equal(calls[0][0], "workbench.action.focusSecondEditorGroup");
});

test("external browser is used only when configured", async () => {
  const { vscode, calls } = createVscode({ "problemLinks.openIn": "externalBrowser" });
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.cn/problems/two-sum/solutions/", 1);
  assert.deepEqual(calls, [["external", "https://leetcode.cn/problems/two-sum/solutions/"]]);
});

test("old VS Code prompts without silently launching an external browser", async () => {
  const { vscode, calls } = createVscode();
  vscode.commands.getCommands = async () => [];
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.cn/problems/two-sum/comments/", 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "warning");
});

test("old VS Code allows the explicitly chosen external fallback", async () => {
  const { vscode, calls } = createVscode();
  vscode.commands.getCommands = async () => [];
  vscode.window.showWarningMessage = async () => "Open in External Browser";
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.cn/problems/two-sum/comments/", 1);
  assert.deepEqual(calls, [["external", "https://leetcode.cn/problems/two-sum/comments/"]]);
});

test("a failing integrated browser reports its error", async () => {
  const { vscode, calls } = createVscode();
  vscode.commands.executeCommand = async (command) => {
    if (command === "workbench.action.browser.open") throw new Error("browser unavailable");
  };
  const { openProblemPage } = loadWithVscode("service/ProblemPageService.js", vscode);
  await openProblemPage("https://leetcode.cn/problems/two-sum/comments/", 1);
  assert.equal(calls[0][0], "error");
  assert.match(calls[0][1], /browser unavailable/);
});
