export const defaultPromptTemplate = [
  "suggest 10 commit messages based on the following diff:",
  "{{diff}}",
  "",
  "commit messages should:",
  " - follow conventional commits",
  " - message format must be: <type>[{{currentBranch}}]: <description>",

  "",
  "examples:",
  " - fix:[{{currentBranch}}] - add password regex pattern",
  " - test:[{{currentBranch}}] - add new test cases",
  " - refactor:[{{currentBranch}}] - update logic around order handling",
  " - feat:[{{currentBranch}}] - add a new option to sync prices",
].join("\n");
