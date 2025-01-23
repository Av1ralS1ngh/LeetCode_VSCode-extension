"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTestCases = void 0;
exports.testCaseandCodeSnippetFromUrl = testCaseandCodeSnippetFromUrl;
exports.extractProblemName = extractProblemName;
const axios_1 = __importDefault(require("axios"));
const graphqlEndpoint = "https://leetcode.com/graphql";
const query = `
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content codeSnippets {
     lang code
    }
  }
}
`;
async function testCaseandCodeSnippetFromUrl(url) {
    try {
        const problemName = extractProblemName(url);
        try {
            const response = await axios_1.default.post(graphqlEndpoint, {
                query,
                variables: { titleSlug: problemName },
            });
            const content = response.data.data.question.content;
            const snippet = response.data.data.question.codeSnippets.filter((snippet) => snippet.lang === "C++" || snippet.lang === "Python");
            const testCases = (0, exports.extractTestCases)(content);
            return [testCases, snippet];
        }
        catch (error) {
            console.error(error);
        }
    }
    catch (error) {
        console.error(error);
    }
}
function extractProblemName(url) {
    const match = url.match(/https:\/\/leetcode\.com\/problems\/([^\/]+)\//);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error("Invalid LeetCode URL format");
}
const extractTestCases = (content) => {
    const preRegex = /<pre>\s*([\s\S]*?)\s*<\/pre>/g;
    const inputOutputRegex = /<strong>Input:<\/strong>\s*([\s\S]*?)\s*<strong>Output:<\/strong>\s*([\s\S]*?)(?=\s*(?:<strong>|$))/g;
    const testCases = [];
    let preMatch;
    while ((preMatch = preRegex.exec(content)) !== null) {
        const preContent = preMatch[1];
        let ioMatch;
        while ((ioMatch = inputOutputRegex.exec(preContent)) !== null) {
            let input = ioMatch[1].trim();
            const output = ioMatch[2].trim();
            // Decode HTML entities and process input string
            input = processInput(decodeHTMLEntities(input));
            testCases.push({ input, output });
        }
    }
    return testCases;
};
exports.extractTestCases = extractTestCases;
function processInput(input) {
    // Split the input by comma and process each part
    const parts = input.split(",").map((part) => part.trim());
    // Initialize array to store processed values
    const processedValues = [];
    for (let part of parts) {
        // If this part is an array (contains '[' and ']')
        if (part.includes("[") && part.includes("]")) {
            processedValues.push(part.trim());
        }
        else {
            // For non-array values, just add the value
            processedValues.push(part.trim());
        }
    }
    // Join all values with a space
    return processedValues.join(" ");
}
function decodeHTMLEntities(text) {
    const entities = {
        "&quot;": '"',
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&nbsp;": " ",
        "&apos;": "'",
    };
    return text.replace(/&[a-z]+;/g, (entity) => entities[entity] || entity);
}
//# sourceMappingURL=leetCodeScraper.js.map