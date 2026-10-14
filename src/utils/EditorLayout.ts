import { ViewColumn, workspace } from "vscode";

export interface IProblemColumns {
  code: ViewColumn;
  content: ViewColumn;
}

export function getProblemColumns(sideMode: boolean): IProblemColumns {
  if (!sideMode) {
    return { code: ViewColumn.One, content: ViewColumn.One };
  }

  const codeOnRight =
    workspace
      .getConfiguration("leetcode-problem-rating")
      .get<string>("editor.codePosition", "right") !== "left";

  return {
    code: codeOnRight ? ViewColumn.Two : ViewColumn.One,
    content: codeOnRight ? ViewColumn.One : ViewColumn.Two,
  };
}
