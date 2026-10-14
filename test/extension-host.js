const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const vm = require("node:vm");
const vscode = require("vscode");

async function waitFor(condition, message, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(message);
}

exports.run = async function () {
  const checks = [];
  const resultPath = process.env.LEETCODE_TEST_RESULTS;
  const { previewService } = require("../out/src/preView/PreviewModule");
  const { solutionService } = require("../out/src/solution/SolutionModule");
  const { submissionService } = require("../out/src/commitResult/CommitResultModule");
  const { treeViewController } = require("../out/src/controller/TreeViewController");
  const { BABA, BabaStr } = require("../out/src/BABA");
  const pages = require("../out/src/service/ProblemPageService");
  const originals = { getProxy: BABA.getProxy, sendNotification: BABA.sendNotification, openPage: pages.openProblemPage };
  const node = { id: "1", qid: "1", name: "Two Sum", tags: [], companies: [], difficulty: "Easy", locked: false };
  const description = JSON.stringify({ url: "https://leetcode.cn/problems/two-sum/description/",
    desc: "<p>Given an array, return the two indices.</p>", category: "Algorithms", difficulty: "Easy", likes: 1, dislikes: 0 });
  let server;
  let command;
  try {
    BABA.getProxy = (name) => {
      if (name === BabaStr.PreviewProxy) return { isSideMode: () => previewService.isSideMode() };
      if (name === BabaStr.LogOutputProxy) return { get_log: () => ({ appendLine() {} }) };
      if (name === BabaStr.ChildCallProxy) return { get_instance: () => ({
        async showProblem(_node, _language, filename) { fs.writeFileSync(filename, "function twoSum(nums, target) {}\n"); return 100; },
      }) };
      throw new Error(`Unexpected test proxy: ${name}`);
    };
    BABA.sendNotification = (name, body) => {
      if (name === BabaStr.BABACMD_previewProblem) previewService.show(description, body.input, body.isSideMode);
    };
    command = vscode.commands.registerCommand("lcpr.showProblem", (problem) => treeViewController.showProblem(problem));

    previewService.show(description, node, false);
    await previewService.onDidReceiveMessage({ command: "ShowProblem" });
    await waitFor(() => previewService.isSideMode() && vscode.window.activeTextEditor?.viewColumn === 2,
      "Code Now did not open the right code group.");
    assert.equal(previewService.panel.viewColumn, 1);
    const codeDocument = vscode.window.activeTextEditor.document;
    checks.push("Code Now opens a real code editor on the right and description on the left");

    previewService.show(description, node, true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(vscode.window.activeTextEditor.document, codeDocument);
    assert.equal(vscode.window.activeTextEditor.viewColumn, 2);
    checks.push("reopening description preserves code focus");

    const html = previewService.panel.webview.html;
    const listeners = {};
    const messages = [];
    const links = ["discussion", "solution"].map((kind) => ({
      getAttribute: () => kind,
      addEventListener: (_event, callback) => { listeners[kind] = callback; },
    }));
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    for (const script of scripts) vm.runInNewContext(script, {
      acquireVsCodeApi: () => ({ postMessage: (message) => messages.push(message) }),
      document: { querySelectorAll: () => links },
    });
    for (const kind of ["discussion", "solution"]) listeners[kind]({ preventDefault() {} });
    assert.equal(messages.length, 2);
    const opened = [];
    pages.openProblemPage = async (url, column) => opened.push({ url, column });
    for (const message of messages) await previewService.onDidReceiveMessage(message);
    await previewService.onDidReceiveMessage({ command: "OpenProblemPage", kind: "invalid" });
    assert.deepEqual(opened, [
      { url: "https://leetcode.cn/problems/two-sum/comments/", column: 1 },
      { url: "https://leetcode.cn/problems/two-sum/solutions/", column: 1 },
    ]);
    pages.openProblemPage = originals.openPage;
    checks.push("rendered Discussion and Solution clicks dispatch the correct URLs and ignore invalid messages");

    solutionService.show(JSON.stringify({ code: 100, hints: ["Use a hash map."] }), true);
    assert.equal(solutionService.panel.viewColumn, 1);
    assert.equal(submissionService.getWebviewOption().viewColumn, 1);
    checks.push("hints and submission results use the description group");

    const settings = vscode.workspace.getConfiguration("leetcode-problem-rating");
    await settings.update("editor.codePosition", "left", vscode.ConfigurationTarget.Global);
    await treeViewController.showProblem(node);
    await waitFor(() => vscode.window.activeTextEditor?.viewColumn === 1 && previewService.panel.viewColumn === 2,
      "The original code-left layout did not apply.");
    assert.equal(solutionService.getWebviewOption().viewColumn, 2);
    assert.equal(submissionService.getWebviewOption().viewColumn, 2);
    previewService.show(description, node, true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(vscode.window.activeTextEditor.viewColumn, 1);
    checks.push("code-left layout and second-group preview preserve focus");

    await settings.update("enableSideMode", false, vscode.ConfigurationTarget.Global);
    await treeViewController.showProblem(node);
    await waitFor(() => !previewService.isSideMode(), "Side mode was not disabled.");
    assert.equal(vscode.window.activeTextEditor.viewColumn, 1);
    assert.equal(previewService.panel.viewColumn, 1);
    checks.push("disabling side mode opens code in the first group");

    await settings.update("enableSideMode", true, vscode.ConfigurationTarget.Global);
    await settings.update("editor.codePosition", "right", vscode.ConfigurationTarget.Global);
    await settings.update("showDescription", "None", vscode.ConfigurationTarget.Global);
    await treeViewController.showProblem(node);
    await waitFor(() => vscode.window.activeTextEditor?.viewColumn === 1, "No-description code opened in the wrong group.");
    checks.push("disabled description does not move code to the second group");

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("workbench.action.browser.open"), "Installed VS Code does not support the integrated browser.");
    let served = false;
    server = http.createServer((_request, response) => {
      served = true;
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("<!doctype html><title>LeetCode browser smoke test</title><p>Integrated browser works.</p>");
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    await pages.openProblemPage(`http://127.0.0.1:${port}/`, vscode.ViewColumn.One);
    await waitFor(() => served, "The integrated browser did not load the smoke test page.");
    checks.push("the real integrated browser command loads a local HTTP page inside VS Code");

    fs.writeFileSync(resultPath, JSON.stringify({ passed: true, vscode: vscode.version, checks }, null, 2));
  } catch (error) {
    fs.writeFileSync(resultPath, JSON.stringify({ passed: false, vscode: vscode.version, checks, error: error.stack }, null, 2));
    throw error;
  } finally {
    BABA.getProxy = originals.getProxy;
    BABA.sendNotification = originals.sendNotification;
    pages.openProblemPage = originals.openPage;
    command?.dispose();
    previewService.dispose();
    solutionService.dispose();
    treeViewController.dispose();
    server?.close();
  }
};
