const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const configured = process.env.VSCODE_EXECUTABLE_PATH;
const candidates = [configured];
if (process.platform === "win32") {
  const where = spawnSync("where.exe", ["code"], { encoding: "utf8", windowsHide: true });
  for (const command of (where.stdout || "").trim().split(/\r?\n/)) {
    if (command) candidates.push(path.resolve(path.dirname(command), "..", "Code.exe"));
  }
  candidates.push(path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "Code.exe"));
  candidates.push(path.join(process.env.ProgramFiles || "", "Microsoft VS Code", "Code.exe"));
}
const executable = candidates.find((candidate) => candidate && fs.existsSync(candidate));
if (!executable) throw new Error("Set VSCODE_EXECUTABLE_PATH to your installed VS Code executable.");

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-leetcode-host-"));
const userData = path.join(testDirectory, "user-data");
const workspace = path.join(testDirectory, "workspace");
fs.mkdirSync(path.join(userData, "User"), { recursive: true });
fs.mkdirSync(workspace, { recursive: true });
fs.writeFileSync(path.join(userData, "User", "settings.json"), JSON.stringify({
  "workbench.startupEditor": "none",
  "workbench.browser.newTabPlacement": "activeGroup",
  "workbench.editor.openSideBySideDirection": "right",
  "telemetry.telemetryLevel": "off",
  "update.mode": "none",
  "leetcode-problem-rating.defaultLanguage": "javascript",
  "leetcode-problem-rating.workspaceFolder": workspace,
  "leetcode-problem-rating.editor.codePosition": "right",
  "leetcode-problem-rating.problemLinks.openIn": "integratedBrowser",
  "leetcode-problem-rating.hint.configWebviewMarkdown": false,
  "leetcode-problem-rating.hint.commentDescription": false,
  "leetcode-problem-rating.hint.commandShortcut": false,
  "leetcode-problem-rating.hint.setDefaultLanguage": false,
}, null, 2));

const env = { ...process.env, LEETCODE_TEST_RESULTS: path.join(testDirectory, "results.json") };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, [
  `--user-data-dir=${userData}`,
  `--extensions-dir=${path.join(testDirectory, "extensions")}`,
  `--extensionDevelopmentPath=${root}`,
  `--extensionTestsPath=${path.join(root, "test", "extension-host.js")}`,
  "--disable-workspace-trust", "--skip-welcome", "--skip-release-notes", "--disable-updates",
  workspace,
], { env, stdio: "inherit", windowsHide: true });

const timeout = setTimeout(() => { child.kill(); console.error("Extension Host test timed out."); }, 180000);
child.on("error", (error) => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
child.on("exit", (code) => {
  clearTimeout(timeout);
  if (fs.existsSync(env.LEETCODE_TEST_RESULTS)) {
    const results = JSON.parse(fs.readFileSync(env.LEETCODE_TEST_RESULTS, "utf8"));
    console.log(JSON.stringify(results, null, 2));
    process.exitCode = results.passed && code === 0 ? 0 : 1;
  } else {
    console.error(`No Extension Host test results. Logs: ${userData}`);
    process.exitCode = 1;
  }
});
