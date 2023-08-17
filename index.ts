#!/usr/bin/env node
import { execSync } from "child_process";

import enquirer from "enquirer";
import ora from "ora";

import { ChatGPTClient } from "./client.js";
import { loadPromptTemplate } from "./config_storage.js";

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG) {
    console.debug(...args);
  }
};

const CUSTOM_MESSAGE_OPTION = "[write own message]...";
const spinner = ora();

// Commit files with these extensions only
const fileExtensions = [
    '*.js',
    '*.css',
    '*.ts',
    '*.md',
    '*.pug',
    '*.html',
    '*.txt',
    '*.yaml',
    '*.json',
];
const extensionsStr = fileExtensions.map(ext => `'${ext}'`).join(' ');

let diff = "";
try {
  diff = execSync(`git diff --cached -- ${extensionsStr}`).toString();
  if (!diff) {
    console.log("No changes to commit.");
    process.exit(0);
  }
} catch (e) {
  console.log("Failed to run git diff --cached");
  process.exit(1);
}

let currentBranch = "";
try {
  currentBranch = execSync("git branch --show-current").toString();
  currentBranch = currentBranch.replace(/[\r\n]/gm, '').trim();
  currentBranch = currentBranch.substring(0, 8);
} catch (e) {
  console.log("Failed to run git branch --show-current");
  process.exit(1);
}

run(diff, currentBranch)
  .then(() => {
    process.exit(0);
  })
  .catch((e: Error) => {
    console.log("Error: " + e.message, e.cause ?? "");
    process.exit(1);
  });

async function run(diff: string, currentBranch: string) {
  // TODO: we should use a good tokenizer here
  const diffTokens = diff.split(" ").length;
  if (diffTokens > 2000) {
    console.log(`Diff is way too bug. Truncating to 700 tokens. It may help`);
    diff = diff.split(" ").slice(0, 700).join(" ");
  }

  const api = new ChatGPTClient();
  
  let prompt = loadPromptTemplate()
    .replace(
      /{{currentBranch}}/g,
      currentBranch
    )
    .replace(
      "{{diff}}",
      ["```", diff, "```"].join("\n")
    );

  while (true) {
    debug("prompt: ", prompt);
    const choices = await getMessages(api, prompt);

    try {
      const answer = await enquirer.prompt<{ message: string }>({
        type: "select",
        name: "message",
        message: "Pick a message",
        choices,
      });

      if (answer.message === CUSTOM_MESSAGE_OPTION) {
        execSync("git commit", { stdio: "inherit" });
        return;
      } else {
        execSync(`git commit -m '${escapeCommitMessage(answer.message)}'`, {
          stdio: "inherit",
        });
        return;
      }
    } catch (e) {
      console.log("Aborted.");
      console.log(e);
      process.exit(1);
    }
  }
}

async function getMessages(api: ChatGPTClient, request: string) {
  spinner.start("Asking ChatGPT 🤖 for commit messages...");

  // send a message and wait for the response
  try {
    const response = await api.getAnswer(request);
    // find json array of strings in the response
    const messages = response
      .split("\n")
      .map(normalizeMessage)
      .filter((l) => l.length > 1);

    spinner.stop();

    debug("response: ", response);

    messages.push(CUSTOM_MESSAGE_OPTION);
    return messages;
  } catch (e) {
    spinner.stop();
    if (e.message === "Unauthorized") {
      return getMessages(api, request);
    } else {
      throw e;
    }
  }
}

function normalizeMessage(line: string) {
  return line
    .trim()
    .replace(/^(\d+\.|-|\*)\s+/, "")
    .replace(/^[`"']/, "")
    .replace(/[`"']$/, "")
    .replace(/[`"']:/, ":") // sometimes it formats messages like this: `feat`: message
    .replace(/:[`"']/, ":") // sometimes it formats messages like this: `feat:` message
    .replace(/\\n/g, "")
    .trim();
}

function escapeCommitMessage(message: string) {
  return message.replace(/'/, `''`);
}
