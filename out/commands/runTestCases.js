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
exports.runTestCasesCommand = runTestCasesCommand;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const codeExectuor_1 = require("../services/codeExectuor");
// Constants for file management
const TEST_CASES_DIR = "test_cases";
const INPUT_FILE = "input.txt";
const EXPECTED_OUTPUT_FILE = "expected_output.txt";
const OUTPUT_FILE = "output.txt";
// Helper function to validate workspace and editor
function validateEnvironment() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found!");
        return;
    }
    const codePath = editor.document.uri.fsPath;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("Workspace not available!");
        return;
    }
    return { codePath, workspaceFolder };
}
// Helper function to determine language from file extension
function determineLanguage(filePath) {
    const extension = path.extname(filePath);
    return extension === ".cpp" ? "cpp" : extension === ".py" ? "python" : null;
}
// Helper function to read and validate test cases
function readTestCases(workspaceFolder) {
    const testCasesPath = path.join(workspaceFolder, TEST_CASES_DIR);
    const inputFilePath = path.join(testCasesPath, INPUT_FILE);
    const expectedOutputFilePath = path.join(testCasesPath, EXPECTED_OUTPUT_FILE);
    if (!fs.existsSync(inputFilePath) || !fs.existsSync(expectedOutputFilePath)) {
        vscode.window.showErrorMessage("Test cases missing. Please fetch first!");
        return;
    }
    try {
        const inputLines = fs.readFileSync(inputFilePath, "utf-8")
            .split("\n")
            .filter(line => line.trim());
        const expectedOutputLines = fs.readFileSync(expectedOutputFilePath, "utf-8")
            .split("\n")
            .filter(line => line.trim());
        if (inputLines.length !== expectedOutputLines.length) {
            vscode.window.showErrorMessage("Mismatch in test case counts!");
            return;
        }
        return { inputs: inputLines, expectedOutputs: expectedOutputLines };
    }
    catch (error) {
        vscode.window.showErrorMessage("Error reading test cases!");
        return;
    }
}
// Unified test case execution handler
async function executeTestCases(language, codePath, workspaceFolder, testCases) {
    let executablePath;
    try {
        if (language === "cpp") {
            executablePath = await (0, codeExectuor_1.compileCpp)(codePath, workspaceFolder);
        }
    }
    catch (compileError) {
        throw new Error(`Compilation failed: ${compileError instanceof Error ? compileError.message : "Unknown error"}`);
    }
    const actualOutputs = [];
    for (const testCase of testCases) {
        try {
            const variables = (0, codeExectuor_1.parseTestCaseLine)(testCase);
            const input = (0, codeExectuor_1.generateInputString)(variables);
            const output = await (0, codeExectuor_1.execute)(language === "cpp" ? executablePath : codePath, input, language);
            actualOutputs.push(output);
        }
        catch (execError) {
            const errorMessage = execError instanceof Error ? execError.message : "Execution failed";
            vscode.window.showErrorMessage(`Test case ${actualOutputs.length + 1}: ${errorMessage}`);
            actualOutputs.push("Execution Error");
        }
    }
    return actualOutputs;
}
// Results processing and display
function processAndDisplayResults(testCases, expectedOutputs, actualOutputs, workspaceFolder) {
    const results = testCases.map((testCase, index) => ({
        testCase,
        actual: actualOutputs[index],
        expected: expectedOutputs[index].trim(),
        passed: actualOutputs[index] === expectedOutputs[index].trim()
    }));
    // Write actual outputs to file
    const outputPath = path.join(workspaceFolder, TEST_CASES_DIR, OUTPUT_FILE);
    fs.writeFileSync(outputPath, actualOutputs.join("\n"));
    // Show quick summary
    const passedCount = results.filter(r => r.passed).length;
    vscode.window.showInformationMessage(`Test Results: ${passedCount}/${results.length} passed`);
    // Display detailed results in webview
    const panel = vscode.window.createWebviewPanel("testResults", "Test Case Results", vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = generateResultsHtml(results);
}
// HTML content generation for results
function generateResultsHtml(results) {
    const resultRows = results.map((result, index) => `
    <tr class="${result.passed ? 'passed' : 'failed'}">
      <td>#${index + 1}</td>
      <td>${result.passed ? '✅ Passed' : '❌ Failed'}</td>
      <td><pre>${result.testCase}</pre></td>
      <td><pre>${result.actual}</pre></td>
      <td><pre>${result.expected}</pre></td>
    </tr>
  `).join("");
    return `
    <html>
    <head>
      <style>
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          margin: 20px;
          background-color: #1a1a1a;
          color: #e0e0e0;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
          background-color: #2d2d2d;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th, td { 
          padding: 14px; 
          border: 1px solid #404040; 
          text-align: left; 
        }
        
        th { 
          background-color: #333333; 
          color: #f0f0f0;
          font-weight: 600;
        }
        
        pre { 
          margin: 0; 
          white-space: pre-wrap;
          font-family: 'Fira Code', monospace;
          color: #d4d4d4;
        }
        
        .passed { 
          background-color: #1a2f1a;
          border-left: 4px solid #28a745;
        }
        
        .failed { 
          background-color: #2f1a1a;
          border-left: 4px solid #dc3545;
        }
        
        .status-header { 
          width: 100px; 
        }
        
        .test-case-header { 
          width: 200px; 
        }
        
        tr:hover {
          background-color: #373737 !important;
          transition: background-color 0.2s ease;
        }
        
        th {
          border-bottom: 2px solid #404040;
        }
        
        td pre {
          padding: 8px;
          background-color: #262626;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h2 style="color: #f0f0f0; border-bottom: 2px solid #404040; padding-bottom: 12px;">
        Detailed Test Results
      </h2>
      <table>
        <thead>
          <tr>
            <th>Case #</th>
            <th class="status-header">Status</th>
            <th class="test-case-header">Test Input</th>
            <th>Actual Output</th>
            <th>Expected Output</th>
          </tr>
        </thead>
        <tbody>
          ${resultRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
async function runTestCasesCommand(context) {
    try {
        // Environment validation
        const env = validateEnvironment();
        if (!env)
            return;
        // Language detection
        const language = determineLanguage(env.codePath);
        if (!language) {
            vscode.window.showErrorMessage("Unsupported language!");
            return;
        }
        // Test case validation
        const testCases = readTestCases(env.workspaceFolder);
        if (!testCases)
            return;
        // Execute test cases
        const actualOutputs = await executeTestCases(language, env.codePath, env.workspaceFolder, testCases.inputs);
        // Process and display results
        processAndDisplayResults(testCases.inputs, testCases.expectedOutputs, actualOutputs, env.workspaceFolder);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        vscode.window.showErrorMessage(`Test execution failed: ${errorMessage}`);
    }
}
//# sourceMappingURL=runTestCases.js.map