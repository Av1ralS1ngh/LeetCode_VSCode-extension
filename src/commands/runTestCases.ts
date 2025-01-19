import vscode from "vscode";
import { executeCode } from "../services/codeExectuor";
import path from "path";

export async function runTestCases() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found!");
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found!");
    return;
  }

  const filePath = editor.document.fileName;
  const language = filePath.endsWith(".py")
    ? "py"
    : filePath.endsWith(".cpp")
    ? "cpp"
    : null;
  if (!language) {
    vscode.window.showErrorMessage(
      "Unsupported language! Only Python and C++ are supported."
    );
    return;
  }

  const problemName = path.basename(filePath, path.extname(filePath));
  await executeCode(language, workspaceFolder, problemName);
}
