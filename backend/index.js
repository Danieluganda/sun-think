#!/usr/bin/env node
import { fetchCommand } from "./src/cli/fetch.js";
import { translateCommand } from "./src/cli/translate.js";
import { statusCommand } from "./src/cli/status.js";
import { retryCommand } from "./src/cli/retry.js";
import { exportCommand } from "./src/cli/exportCmd.js";
import { pretranslateWidgetCommand } from "./src/cli/pretranslateWidget.js";

const commands = {
  fetch: fetchCommand,
  translate: translateCommand,
  status: statusCommand,
  retry: retryCommand,
  export: exportCommand,
  "pretranslate-widget": pretranslateWidgetCommand
};

const [commandName, ...args] = process.argv.slice(2);

if (!commandName || !commands[commandName]) {
  console.log("Usage: npm run cli -- <fetch|translate|status|retry|export|pretranslate-widget> [args]");
  process.exit(commandName ? 1 : 0);
}

try {
  await commands[commandName](args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
