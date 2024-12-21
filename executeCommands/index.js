import { execSync } from "child_process";

const formator = async (prompt) => {
  const regex = /```(.*?)\n([\s\S]*?)```/g;
  const matches = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    const language = match[1].trim(); // e.g., "bash" or "python"
    const commands = match[2]
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line); // Ignore empty lines
    matches.push({ language, commands });
  }

  const results = [];
  for (const { language, commands } of matches) {
    if (language !== "bash") {
      results.push({ error: `Unsupported language: ${language}`, commands });
      continue;
    }

    for (const command of commands) {
      try {
        const result = await executeCommand(command);
        results.push({ success: true, ...result });
      } catch (err) {
        results.push({ success: false, ...err });
      }
    }
  }

  return results;
};

const executeChainOfCommands = async (prompt) => {
  // const regex = /```([\s\S]*?)```/g;
  // const matches = [];
  // let match;
  // while ((match = regex.exec(prompt)) !== null) {
  //   const codeBlock = match[1].trim();
  //   matches.push(
  //     ...codeBlock
  //       .split("\n")
  //       .map((line) => line.trim())
  //       .filter((line) => line !== "bash")
  //   );
  // }
  const commands = await formator(prompt);
  return await executeCommands(commands);
};

// Function to execute commands and rollback on failure
function executeCommands(commands) {
  const executedCommands = [];
  try {
    for (const command of commands) {
      console.log(`Executing: ${command}`);
      execSync(command, { stdio: "pipe" }); // Capture stdout and stderr
      executedCommands.push(command); // Track executed commands
    }
    console.log("All commands executed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error occurred while executing a command:");
    console.error(`Failed Command: ${commands[executedCommands.length]}`);
    console.error(`Error Message: ${error.message}`);
    console.error(
      `Error Details: ${
        error.stderr?.toString().trim() || "No additional details available."
      }`
    );
    console.error("Rolling back changes...");
    rollbackChanges(executedCommands);
    return {
      error: error.message,
      details:
        error.stderr?.toString().trim() || "No additional details available.",
    };
  }
}

function rollbackChanges(executedCommands) {
  executedCommands.reverse().forEach((command) => {
    console.log(`Rolling back: ${command}`);
    // Implement rollback logic if applicable for each command
  });
}

export default executeChainOfCommands;
