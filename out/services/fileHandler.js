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
exports.saveTestCases = saveTestCases;
exports.createProblemFile = createProblemFile;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function saveTestCases(testCases) {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const folderPath = path.join(workspaceFolder.uri.fsPath, "test_cases");
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        const inputFilePath = path.join(folderPath, "input.txt");
        const outputFilePath = path.join(folderPath, "expected_output.txt");
        const outputPath = path.join(folderPath, "output.txt");
        const inputData = testCases.map((testCase) => testCase.input).join("\n");
        const outputData = testCases.map((testCase) => testCase.output).join("\n");
        fs.writeFileSync(inputFilePath, inputData, "utf-8");
        fs.writeFileSync(outputFilePath, outputData, "utf-8");
        fs.writeFileSync(outputPath, "", "utf-8");
        vscode.window.showInformationMessage("Test cases saved successfully!");
    }
    catch (error) {
        vscode.window.showErrorMessage(`An error occurred while saving files: ${error}`);
    }
}
async function createProblemFile(problemName, language, workspacePath, snippet) {
    const fileName = `${problemName}.${language === "C++" ? "cpp" : "py"}`;
    const langSnippet = `${language === "C++" ? snippet[0].code : snippet[1].code}`;
    const filePath = path.join(workspacePath, fileName);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, langSnippet, "utf-8");
    }
    return filePath;
}
//# sourceMappingURL=fileHandler.js.map