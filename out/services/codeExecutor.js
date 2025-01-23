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
exports.CodeExecutor = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CodeExecutor {
    workspaceRoot;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    // Compiles C++ code
    async compileCpp(filePath) {
        const outputPath = path.join(path.dirname(filePath), "solution.exe");
        const compileCommand = `g++ "${filePath}" -o "${outputPath}"`;
        try {
            await execAsync(compileCommand);
            return outputPath;
        }
        catch (error) {
            this.showErrorInTerminal("Compilation Error", error.stderr || error.message);
            throw new Error("Compilation failed");
        }
    }
    // Generates a runner script to handle input/output
    async generateRunner(language, filePath, inputPath, outputPath) {
        const dir = path.dirname(filePath);
        const runnerPath = path.join(dir, `runner.${language === "Python" ? "py" : "cpp"}`);
        const sourceCode = fs.readFileSync(filePath, "utf8");
        if (language === "Python") {
            const runnerCode = `
import sys

${sourceCode}

if __name__ == "__main__":
    with open('${inputPath}', 'r') as input_file, open('${outputPath}', 'w') as output_file:
        for line in input_file:
            if not line.strip():
                continue
            nums, target = eval(line.strip())
            solution = Solution()
            result = solution.twoSum(nums, target)
            output_file.write(str(result) + '\\n')
`;
            fs.writeFileSync(runnerPath, runnerCode);
        }
        else {
            const runnerCode = `
#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>
${sourceCode}

std::vector<int> parseArray(const std::string& input) {
    std::vector<int> result;
    std::istringstream iss(input.substr(1, input.find(']') - 1));
    int num;
    while (iss >> num) {
        result.push_back(num);
    }
    return result;
}

int main() {
    std::ifstream inputFile("${inputPath}");
    std::ofstream outputFile("${outputPath}");
    Solution solution;

    std::string line;
    while (std::getline(inputFile, line)) {
        if (line.empty()) continue;

        std::size_t pos = line.find("]");
        std::vector<int> nums = parseArray(line.substr(0, pos + 1));
        int target = std::stoi(line.substr(pos + 2));

        std::vector<int> result = solution.twoSum(nums, target);
        outputFile << "[";
        for (std::size_t i = 0; i < result.size(); ++i) {
            if (i > 0) outputFile << ", ";
            outputFile << result[i];
        }
        outputFile << "]\\n";
    }
    return 0;
}
`;
            fs.writeFileSync(runnerPath, runnerCode);
        }
        return runnerPath;
    }
    // Executes the code and manages errors
    async executeCode(filePath, language) {
        try {
            const dir = path.dirname(filePath);
            const testCaseDir = path.join(dir, "test_cases");
            if (!fs.existsSync(testCaseDir)) {
                fs.mkdirSync(testCaseDir, { recursive: true });
            }
            const inputPath = path.join(testCaseDir, "input.txt");
            const outputPath = path.join(testCaseDir, "output.txt");
            const runnerPath = await this.generateRunner(language, filePath, inputPath, outputPath);
            if (language === "cpp") {
                const execPath = await this.compileCpp(runnerPath);
                try {
                    const { stderr } = await execAsync(`"${execPath}"`);
                    if (stderr)
                        throw new Error(stderr);
                }
                catch (error) {
                    this.showErrorInTerminal("Runtime Error", error.message);
                    throw error;
                }
            }
            else if (language === "Python") {
                try {
                    const { stderr } = await execAsync(`python "${runnerPath}"`);
                    if (stderr)
                        throw new Error(stderr);
                }
                catch (error) {
                    this.showErrorInTerminal("Runtime Error", error.message);
                    throw error;
                }
            }
            vscode.window.showInformationMessage(`Execution completed. Output saved at ${outputPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(error.message);
        }
    }
    // Shows errors in a terminal
    showErrorInTerminal(title, message) {
        const terminal = vscode.window.createTerminal(title);
        terminal.show();
        terminal.sendText(message);
    }
}
exports.CodeExecutor = CodeExecutor;
//# sourceMappingURL=codeExecutor.js.map