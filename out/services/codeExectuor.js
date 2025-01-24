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
exports.compileCpp = compileCpp;
exports.execute = execute;
exports.parseTestCaseLine = parseTestCaseLine;
exports.generateInputString = generateInputString;
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
async function compileCpp(codePath, workspaceFolder) {
    const compiler = "g++";
    const outputExe = path.join(workspaceFolder, "problem_executable");
    const args = [codePath, "-o", outputExe, "-std=c++17"];
    return new Promise((resolve, reject) => {
        const process = (0, child_process_1.spawn)(compiler, args);
        let stderr = "";
        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        process.on("close", (code) => {
            if (code === 0) {
                resolve(outputExe);
            }
            else {
                reject(new Error(`Compilation failed: ${stderr}`));
            }
        });
    });
}
async function execute(executablePath, input, language) {
    return new Promise((resolve, reject) => {
        let process;
        const isWindows = os.platform() === "win32";
        const pythonCommand = isWindows ? "python" : "python3";
        if (language === "cpp") {
            process = (0, child_process_1.spawn)(executablePath, [], { stdio: "pipe" });
        }
        else if (language === "python") {
            process = (0, child_process_1.spawn)(pythonCommand, [executablePath], {
                stdio: "pipe",
            });
        }
        else {
            reject(new Error("Unsupported language"));
            return;
        }
        let stdout = "";
        let stderr = "";
        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        process.stdin.write(input);
        process.stdin.end();
        process.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Execution error: ${stderr}`));
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
}
function parseTestCaseLine(line) {
    const regex = /(\w+)\s*=\s*((?:\[.*?\]|[^=\s])+)/g;
    const variables = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
        const key = match[1];
        let valueStr = match[2].trim();
        if (valueStr.startsWith("[") && valueStr.endsWith("]")) {
            valueStr = valueStr.slice(1, -1).trim();
            const elements = valueStr.split(/\s+/).map((e) => {
                const num = Number(e);
                return isNaN(num) ? e : num;
            });
            variables.push({ key, value: elements });
        }
        else {
            const num = Number(valueStr);
            variables.push({ key, value: isNaN(num) ? valueStr : num });
        }
    }
    return variables;
}
function generateInputString(variables) {
    return (variables
        .map((v) => {
        if (Array.isArray(v.value)) {
            return v.value.join(" ");
        }
        else {
            return v.value.toString();
        }
    })
        .join("\n") + "\n");
}
//# sourceMappingURL=codeExectuor.js.map