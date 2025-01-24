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
exports.fetchTestCases = fetchTestCases;
const vscode = __importStar(require("vscode"));
const leetCodeScraper_1 = require("../services/leetCodeScraper");
const fileHandler_1 = require("../services/fileHandler");
const layoutManager_1 = require("../ui/layoutManager");
async function fetchTestCases() {
    try {
        const questionLink = await vscode.window.showInputBox({
            placeHolder: "https://leetcode.com/problems/two-sum",
            prompt: "Please enter the LeetCode problem URL.",
        });
        if (questionLink === "" || questionLink === undefined) {
            vscode.window.showErrorMessage("No URL entered. Please try again.");
            return;
        }
        const validUrl = isValidLeetCodeUrl(questionLink);
        if (!validUrl) {
            vscode.window.showErrorMessage("Invalid LeetCode URL. Please try again.");
            return;
        }
        const fetchingMessage = vscode.window.setStatusBarMessage(`Fetching test cases and arranging the view`);
        const testCaseandCodeSnippet = await (0, leetCodeScraper_1.testCaseandCodeSnippetFromUrl)(questionLink);
        if (testCaseandCodeSnippet && Array.isArray(testCaseandCodeSnippet)) {
            await (0, fileHandler_1.saveTestCases)(testCaseandCodeSnippet[0]);
            fetchingMessage.dispose();
            const language = await askUserForLanguage();
            if (!language) {
                return;
            }
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage("No workspace folder found.");
                return;
            }
            const workspacePath = workspaceFolder.uri.fsPath;
            const problemName = (0, leetCodeScraper_1.extractProblemName)(questionLink);
            const mainFilePath = await (0, fileHandler_1.createProblemFile)(problemName, language, workspacePath
            // testCaseandCodeSnippet[1]
            );
            await (0, layoutManager_1.setupLayout)(mainFilePath);
        }
        else {
            vscode.window.showErrorMessage("No test cases found.");
            fetchingMessage.dispose();
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`An error occurred: ${error}`);
    }
}
function isValidLeetCodeUrl(url) {
    try {
        const parsed = new URL(url);
        return (parsed.hostname === "leetcode.com" &&
            parsed.pathname.startsWith("/problems/"));
    }
    catch {
        return false;
    }
}
async function askUserForLanguage() {
    const language = await vscode.window.showQuickPick(["C++", "Python"], {
        placeHolder: "Select your preferred programming language",
    });
    if (!language) {
        vscode.window.showErrorMessage("No language selected. Please try again.");
        return;
    }
    vscode.window.showInformationMessage(`You selected ${language}`);
    return language;
}
//# sourceMappingURL=fetchTestCases.js.map