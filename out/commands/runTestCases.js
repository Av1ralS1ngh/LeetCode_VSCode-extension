"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTestCases = runTestCases;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const codeExecutor_1 = require("../services/codeExecutor"); // Ensure correct path
/**
 * Runs test cases by comparing actual output with expected output.
 */
async function runTestCases() {
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
        const executor = new codeExecutor_1.CodeExecutor(workspaceRoot);
        // Execute the code using CodeExecutor
        await executor.executeCode(filePath, language);
        // Compare actual output with expected output
        const actualOutput = fs.readFileSync(actualOutputPath, "utf8").trim();
        const expectedOutput = fs.readFileSync(expectedOutputPath, "utf8").trim();
        const testCases = actualOutput.split("\n");
        const expectedCases = expectedOutput.split("\n");
        if (testCases.length !== expectedCases.length) {
            vscode.window.showErrorMessage("Mismatch between the number of actual and expected test case outputs.");
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
        }
        else {
            vscode.window.showWarningMessage("Some test cases failed. Check the report.");
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}
//# sourceMappingURL=runTestCases.js.map