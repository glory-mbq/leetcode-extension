# Validation for the glory-mbq 3.2.5 release

Validated on Windows with Node.js 24.21.0 and VS Code 1.141.0.

## Automated regression tests

`npm test`: 15 tests passed. Coverage includes default and reversed layouts, disabled side mode, Chinese and international problem-page URLs, legacy Chinese URLs, root problem URLs without `/description/`, invalid URLs, integrated-browser dispatch, explicit external-browser selection, unavailable browser commands, and browser errors.

New TypeScript helpers pass the repository's ESLint configuration. `git diff --check` passes.

## Extension Host validation

`npm run test:extension`: eight checks passed in a real, isolated VS Code Extension Host:

1. Code Now opens the code document in group two and the description in group one.
2. Reopening the description preserves the code document and focus.
3. Scripts from the rendered Webview dispatch Discussion and Solution messages with the correct URLs; invalid message kinds are ignored.
4. Hints and submission-result options follow the description group.
5. The optional code-left layout works and preserves focus when revealing a second-group description.
6. Disabling side mode keeps code and description in the first group.
7. Disabling Webview descriptions keeps code in the first group.
8. The actual integrated-browser command loads a local HTTP fixture inside VS Code.

The LeetCode data provider is replaced by a fixture for these tests. No authenticated LeetCode requests, real solution submissions, or live Discussion/Solution page rendering are part of the checks. Browser login and remote-site availability depend on the user's session and network.

The installed VS Code was holding an update mutex during validation, so the Extension Host ran against an isolated copy of the installed runtime with updates disabled. The user's installed runtime and settings were not modified. `VSCODE_EXECUTABLE_PATH` can select an installed or portable VS Code runtime for reproducing the tests.

## Package

`npx @vscode/vsce package --out artifacts/leetcode-glory-mbq-3.2.5.vsix` succeeded. The VSIX uses extension ID `glory-mbq.vscode-leetcode-problem-rating`; its command IDs, view IDs, and settings namespace are shared with the upstream extension, so disable upstream before enabling this fork.
