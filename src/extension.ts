import * as vscode from "vscode";
import { fetchTestCases } from "./commands/fetchTestCases";
import { runTestCases } from "./commands/runTestCases";

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "cph-for-leetcode" is now active!'
  );

  const fetchTestCasesCommand = vscode.commands.registerCommand(
    "cph.FetchTestCases",
    fetchTestCases
  );

  const runTestCasesCommand = vscode.commands.registerCommand(
    "cph.RunTestCases",
    runTestCases
  );

  context.subscriptions.push(fetchTestCasesCommand);
  context.subscriptions.push(runTestCasesCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
