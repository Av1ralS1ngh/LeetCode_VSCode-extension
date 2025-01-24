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
exports.TestCasesPanel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class TestCasesPanel {
    static currentPanel;
    _panel;
    _disposables = [];
    _watcher;
    constructor(panel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        this.setupWebviewMessageListener();
        this.setupFileWatcher();
    }
    async setupFileWatcher() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        const outputPath = path.join(workspaceFolder.uri.fsPath, "test_cases", "output.txt");
        this._watcher = vscode.workspace.createFileSystemWatcher(outputPath);
        this._watcher.onDidChange(async () => {
            this._panel.webview.postMessage({ type: 'outputUpdated' });
            await this.updateContent();
        }, null, this._disposables);
    }
    static createOrShow() {
        const column = vscode.ViewColumn.Two;
        if (TestCasesPanel.currentPanel) {
            TestCasesPanel.currentPanel._panel.reveal(column);
            return TestCasesPanel.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel("testCases", "Test Cases", column, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        TestCasesPanel.currentPanel = new TestCasesPanel(panel);
        return TestCasesPanel.currentPanel;
    }
    async updateContent() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error("No workspace folder found");
            }
            const testCasesPath = path.join(workspaceFolder.uri.fsPath, "test_cases");
            const input = await fs.readFile(path.join(testCasesPath, "input.txt"), "utf8");
            const expectedOutput = await fs.readFile(path.join(testCasesPath, "expected_output.txt"), "utf8");
            const output = await fs
                .readFile(path.join(testCasesPath, "output.txt"), "utf8")
                .catch(() => "");
            this._panel.webview.postMessage({
                type: "update",
                input,
                expectedOutput,
                output,
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error updating test cases: ${error}`);
        }
    }
    async saveInput(input) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error("No workspace folder found");
            }
            const inputPath = path.join(workspaceFolder.uri.fsPath, "test_cases", "input.txt");
            await fs.writeFile(inputPath, input, "utf8");
            vscode.window.showInformationMessage("Test cases updated successfully!");
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error saving input: ${error}`);
        }
    }
    _getWebviewContent() {
        return `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                  :root {
                      --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      --success-gradient: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                      --danger-gradient: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
                      --hover-effect: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  }
    
                  body {
                      font-family: 'Segoe UI', system-ui, sans-serif;
                      padding: 1.5rem;
                      margin: 0;
                      background:rgb(27, 27, 27);
                      min-height: 100vh;
                      color: #1a202c;
                  }
    
                  .header {
                      display: flex;
                      gap: 1rem;
                      margin-bottom: 2rem;
                  }
    
                  .btn {
                      padding: 0.8rem 1.5rem;
                      border-radius: 0.5rem;
                      border: none;
                      cursor: pointer;
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      font-weight: 600;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      position: relative;
                      overflow: hidden;
                      background-size: 200% auto;
                  }
    
                  .btn::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      background: rgba(255, 255, 255, 0.1);
                      opacity: 0;
                      transition: opacity 0.3s ease;
                  }
    
                  .btn:hover::after {
                      opacity: 1;
                  }
    
                  .btn-primary {
                      background-image: var(--primary-gradient);
                      color: white;
                      box-shadow: 0 2px 4px rgba(113, 128, 185, 0.3);
                  }
    
                  .btn-success {
                      background-image: var(--success-gradient);
                      color: white;
                      box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
                  }
    
                  .btn-danger {
                      background-image: var(--danger-gradient);
                      color: white;
                      box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
                  }
    
                  .container {
                      display: grid;
                      gap: 1.5rem;
                      flex: 1;
                  }
    
                  .section {
                      background: white;
                      border-radius: 0.75rem;
                      padding: 1.5rem;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                      transition: transform 0.3s ease;
                  }
    
                  .section:hover {
                      transform: translateY(-2px);
                  }
    
                  .section-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 1rem;
                  }
    
                  h3 {
                      margin: 0;
                      font-size: 1.125rem;
                      font-weight: 700;
                      color: #2d3748;
                  }
    
                  textarea {
                      width: 100%;
                      min-height: 150px;
                      padding: 1rem;
                      border: 2px solid #e2e8f0;
                      border-radius: 0.5rem;
                      background: #f8fafc;
                      color: #1a202c;
                      font-family: 'Fira Code', monospace;
                      resize: vertical;
                      transition: all 0.3s ease;
                  }
    
                  textarea:focus {
                      outline: none;
                      border-color: #667eea;
                      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
                  }
    
                  pre {
                      margin: 0;
                      padding: 1rem;
                      background:rgb(255, 255, 255);
                      border: 2px solidrgb(0, 35, 80);
                      border-radius: 0.5rem;
                      white-space: pre-wrap;
                      max-height: 300px;
                      overflow-y: auto;
                      transition: all 0.3s ease;
                  }
    
                  .output-updated {
                      animation: highlight 1.5s ease-out;
                  }
    
                  @keyframes highlight {
                      0% { background-color: rgba(102, 126, 234, 0.1); }
                      100% { background-color: transparent; }
                  }
    
                  .status-indicator {
                      font-size: 0.875rem;
                      padding: 0.25rem 0.75rem;
                      border-radius: 9999px;
                      background: #e2e8f0;
                      color: #4a5568;
                      font-weight: 500;
                  }
              </style>
          </head>
          <body>
              <div class="header">
                  <button class="btn btn-primary" id="runBtn">
                      <span id="runText">▶ Run Tests</span>
                  </button>
                  <button class="btn btn-success" id="fetchBtn">
                      <span id="fetchText">↻ Fetch Cases</span>
                  </button>
              </div>
              
              <div class="container">
                  <div class="section">
                      <div class="section-header">
                          <h3>Test Cases Input</h3>
                          <button class="btn btn-danger" id="saveInput">
                              💾 Save Changes
                          </button>
                      </div>
                      <textarea 
                          id="input" 
                          placeholder="Enter your test cases here..."
                          spellcheck="false"
                      ></textarea>
                  </div>
    
                  <div class="section">
                      <div class="section-header">
                          <h3>Expected Output</h3>
                          <span class="status-indicator">Reference Data</span>
                      </div>
                      <pre id="expected-output"></pre>
                  </div>
    
                  <div class="section">
                      <div class="section-header">
                          <h3>Execution Output</h3>
                          <span class="status-indicator">Live Results</span>
                      </div>
                      <pre id="output" class="output-updated"></pre>
                  </div>
              </div>
    
              <script>
                  const vscode = acquireVsCodeApi();
                  const inputTextarea = document.getElementById('input');
                  const outputPre = document.getElementById('output');
                  
                  // Button handlers without loading states
                  ['run', 'fetch'].forEach(type => {
                      const btn = document.getElementById(\`\${type}Btn\`);
                      btn.addEventListener('click', () => {
                          vscode.postMessage({ type });
                      });
                  });
    
                  document.getElementById('saveInput').addEventListener('click', () => {
                      vscode.postMessage({
                          type: 'saveInput',
                          value: inputTextarea.value
                      });
                  });
    
                  // Auto-resize textarea
                  inputTextarea.style.height = 'auto';
                  inputTextarea.style.height = inputTextarea.scrollHeight + 'px';
                  inputTextarea.addEventListener('input', function() {
                      this.style.height = 'auto';
                      this.style.height = this.scrollHeight + 'px';
                  });
    
                  // Message listener
                  window.addEventListener('message', event => {
                      const message = event.data;
                      if (message.type === 'update') {
                          inputTextarea.value = message.input;
                          document.getElementById('expected-output').textContent = message.expectedOutput;
                          outputPre.textContent = message.output || 'No output yet';
                          
                          // Add highlight animation
                          outputPre.classList.add('output-updated');
                          setTimeout(() => {
                              outputPre.classList.remove('output-updated');
                          }, 1500);
                      }
                  });
    
                  // Handle output updates from file watcher
                  window.addEventListener('message', event => {
                      if (event.data.type === 'outputUpdated') {
                          outputPre.classList.add('output-updated');
                          setTimeout(() => {
                              outputPre.classList.remove('output-updated');
                          }, 1500);
                      }
                  });
              </script>
          </body>
          </html>
      `;
    }
    setupWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case "run":
                    await vscode.commands.executeCommand('cph.RunTestCases');
                    break;
                case "fetch":
                    await vscode.commands.executeCommand('cph.FetchTestCases');
                    break;
                case "saveInput":
                    await this.saveInput(message.value);
                    break;
            }
        }, null, this._disposables);
    }
    dispose() {
        TestCasesPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.TestCasesPanel = TestCasesPanel;
//# sourceMappingURL=webView.js.map