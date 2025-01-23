import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class CodeExecutor {
  constructor(private workspaceRoot: string) {}

  // Compiles C++ code
  private async compileCpp(filePath: string): Promise<string> {
    const outputPath = path.join(path.dirname(filePath), "solution.exe");
    const compileCommand = `g++ "${filePath}" -o "${outputPath}"`;

    try {
      await execAsync(compileCommand);
      return outputPath;
    } catch (error: any) {
      this.showErrorInTerminal("Compilation Error", error.stderr || error.message);
      throw new Error("Compilation failed");
    }
  }

  // Generates a runner script to handle input/output
  private async generateRunner(
    language: string,
    filePath: string,
    inputPath: string,
    outputPath: string
  ): Promise<string> {
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
    } else {
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
  async executeCode(filePath: string, language: string): Promise<void> {
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
          if (stderr) throw new Error(stderr);
        } catch (error: any) {
          this.showErrorInTerminal("Runtime Error", error.message);
          throw error;
        }
      } else if (language === "Python") {
        try {
          const { stderr } = await execAsync(`python "${runnerPath}"`);
          if (stderr) throw new Error(stderr);
        } catch (error: any) {
          this.showErrorInTerminal("Runtime Error", error.message);
          throw error;
        }
      }

      vscode.window.showInformationMessage(`Execution completed. Output saved at ${outputPath}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
  }

  // Shows errors in a terminal
  private showErrorInTerminal(title: string, message: string): void {
    const terminal = vscode.window.createTerminal(title);
    terminal.show();
    terminal.sendText(message);
  }
}
