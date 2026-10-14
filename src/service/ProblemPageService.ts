import { URL } from "url";
import { commands, env, Uri, ViewColumn, window, workspace } from "vscode";

export type ProblemPage = "discussion" | "solution";

export function getProblemPageUrl(
  descriptionUrl: string,
  page: ProblemPage
): string {
  const url = new URL(descriptionUrl);
  const allowedHosts = ["leetcode.cn", "leetcode.com", "leetcode-cn.com"];
  const problemPath = url.pathname.match(/^\/problems\/([^/]+)(?:\/|$)/);
  if (
    url.protocol !== "https:" ||
    !allowedHosts.includes(url.hostname) ||
    !problemPath ||
    url.username ||
    url.password
  ) {
    throw new Error("Invalid LeetCode problem URL.");
  }

  const isChineseSite = url.hostname !== "leetcode.com";
  if (isChineseSite) {
    url.hostname = "leetcode.cn";
  }
  url.search = "";
  url.hash = "";
  url.pathname = `/problems/${problemPath[1]}/${
    page === "solution" ? "solutions" : isChineseSite ? "comments" : "discuss"
  }/`;
  if (page === "discussion" && !isChineseSite) {
    url.search = "?currentPage=1&orderBy=most_votes&query=";
  }
  return url.toString();
}

export async function openProblemPage(
  url: string,
  viewColumn: ViewColumn
): Promise<void> {
  const target = workspace
    .getConfiguration("leetcode-problem-rating")
    .get<string>("problemLinks.openIn", "integratedBrowser");
  if (target === "externalBrowser") {
    await env.openExternal(Uri.parse(url));
    return;
  }

  const browserCommand = "workbench.action.browser.open";
  const availableCommands = await commands.getCommands(true);
  if (!availableCommands.includes(browserCommand)) {
    const openExternal = "Open in External Browser";
    const choice = await window.showWarningMessage(
      "This VS Code version does not provide an integrated browser. " +
        "Update VS Code to open Discussion and Solution inside the editor.",
      openExternal
    );
    if (choice === openExternal) {
      await env.openExternal(Uri.parse(url));
    }
    return;
  }

  try {
    await commands.executeCommand(
      viewColumn === ViewColumn.Two
        ? "workbench.action.focusSecondEditorGroup"
        : "workbench.action.focusFirstEditorGroup"
    );
    // A string URL is supported by the integrated browser command. Its placement
    // follows workbench.browser.newTabPlacement, without changing user settings.
    await commands.executeCommand(browserCommand, url);
  } catch (error) {
    await window.showErrorMessage(
      `Unable to open the integrated browser: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
