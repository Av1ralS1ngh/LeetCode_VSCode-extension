import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CodeExecutor } from "../services/codeExecutor"; // Ensure correct path

/**
 * Runs test cases by comparing actual output with expected output.
 */
export async function runTestCases(): Promise<void> {
  // Get the active text editor
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("No active file found. Open a file to run test cases.");
    return;
  }

  const filePath = editor.document.fileName;
  const language = path.extname(filePath) === ".cpp" ? "cpp" : "python";
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showErrorMessage("Workspace folder not found.");
    return;
  }

  try {
    const dir = path.dirname(filePath);
    const testCaseDir = path.join(dir, "test_cases");
    if (!fs.existsSync(testCaseDir)) {
      vscode.window.showErrorMessage("Test cases directory does not exist.");
      return;
    }

    const inputPath = path.join(testCaseDir, "input.txt");
    const expectedOutputPath = path.join(testCaseDir, "expected_output.txt");
    const actualOutputPath = path.join(testCaseDir, "output.txt");

    if (!fs.existsSync(inputPath) || !fs.existsSync(expectedOutputPath)) {
      vscode.window.showErrorMessage("Input or expected output files are missing.");
      return;
    }

    // Create an instance of CodeExecutor
    const executor = new CodeExecutor(workspaceRoot);

    // Execute the code using CodeExecutor
    await executor.executeCode(filePath, language);

    // Compare actual output with expected output
    const actualOutput = fs.readFileSync(actualOutputPath, "utf8").trim();
    const expectedOutput = fs.readFileSync(expectedOutputPath, "utf8").trim();

    const testCases = actualOutput.split("\n");
    const expectedCases = expectedOutput.split("\n");

    if (testCases.length !== expectedCases.length) {
      vscode.window.showErrorMessage(
        "Mismatch between the number of actual and expected test case outputs."
      );
      return;
    }

    // Generate a test report
    let report = "Test Case Results:\n";
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
      const testCaseResult = testCases[i] === expectedCases[i];
      report += `Test Case ${i + 1}: ${testCaseResult ? "✅ Passed" : "❌ Failed"}\n`;
      if (!testCaseResult) {
        report += `  Expected: ${expectedCases[i]}\n  Got: ${testCases[i]}\n`;
        allPassed = false;
      }
    }

    // Show report in an output channel
    const outputChannel = vscode.window.createOutputChannel("Test Case Results");
    outputChannel.appendLine(report);
    outputChannel.show();

    if (allPassed) {
      vscode.window.showInformationMessage("All test cases passed! 🎉");
    } else {
      vscode.window.showWarningMessage("Some test cases failed. Check the report.");
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  }
}
