#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import figlet from "figlet";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import ora from "ora"; // Import ora for loading spinner
import executeChainOfCommands from "./executeCommands/index.js";

const program = new Command();

// Configuration file path
const configPath = path.join(os.homedir(), ".ai-cli-config.json");

// Check if configuration file exists, create it if not
if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    apiKey: "",
    instructions:
      "you must give me a series of CLI commands in bash, nothing more than. I am strictly preventing you from saying 'ok'. program: ",
    model: "gemini-1.5-flash",
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

// Function to load the configuration
const loadConfig = () => {
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
};

// Command to show the header
const showHeader = () => {
  console.log(
    chalk.blue(
      figlet.textSync("AI CLI", {
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );
};

// Command to view or edit the configuration
program
  .command("config")
  .description("View or update the API key, instructions, and model")
  .action(async () => {
    showHeader();
    const config = loadConfig();

    // Show current configuration
    console.log(chalk.green("Current Configuration:"));
    console.log(chalk.cyan(`API Key: ${config.apiKey}`));
    console.log(chalk.cyan(`Instructions: ${config.instructions}`));
    console.log(chalk.cyan(`Model: ${config.model}`));

    // Ask if the user wants to update the configuration
    const { updateConfig } = await inquirer.prompt([
      {
        type: "confirm",
        name: "updateConfig",
        message:
          "Would you like to update the API Key, Instructions, or Model?",
        default: false,
      },
    ]);

    if (updateConfig) {
      const { newApiKey, newInstructions, newModel } = await inquirer.prompt([
        {
          type: "input",
          name: "newApiKey",
          message: "Enter the new API Key:",
          default: config.apiKey,
        },
        {
          type: "input",
          name: "newInstructions",
          message: "Enter the new Instructions:",
          default: config.instructions,
        },
        {
          type: "list",
          name: "newModel",
          message: "Choose the AI model:",
          choices: ["gemini-1.5-flash", "openai-gpt-3.5", "custom-model"], // Add more models if needed
          default: config.model,
        },
      ]);

      // Update the configuration file
      const updatedConfig = {
        apiKey: newApiKey,
        instructions: newInstructions,
        model: newModel,
      };
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      console.log(chalk.green("Configuration updated successfully!"));
    }
  });

// Command to start a conversation
program
  .command("chat")
  .description("Start a conversation with the AI")
  .action(async () => {
    showHeader();

    let isChatting = true;
    const conversationHistoryPath = path.join(
      os.homedir(),
      ".ai-cli-history.json"
    );

    // Initialize the conversation history file if it doesn't exist
    if (!fs.existsSync(conversationHistoryPath)) {
      fs.writeFileSync(conversationHistoryPath, JSON.stringify([], null, 2));
    }

    const conversationHistory = JSON.parse(
      fs.readFileSync(conversationHistoryPath, "utf-8")
    );

    console.log(
      chalk.green(
        "Type your queries below. Type 'exit' to end the conversation."
      )
    );

    while (isChatting) {
      const { userInput } = await inquirer.prompt([
        {
          type: "input",
          name: "userInput",
          message: chalk.yellow("You: "),
        },
      ]);

      if (userInput.toLowerCase() === "exit") {
        isChatting = false;
        console.log(chalk.blue("Goodbye!"));
        break;
      }

      // Load the configuration (API Key, Instructions, and Model)
      const config = loadConfig();
      if (!config.apiKey) {
        console.error(
          chalk.red(
            `Please provide api key first for ${config.model}, ${
              config.model === "gemini-1.5-flash" &&
              "get your api key from https://ai.google.dev/gemini-api/docs/api-key then run 'acli config'"
            }. Other models are also available!`
          )
        );
        return;
      }
      if (!config.model) {
        console.error(chalk.red(`Please select a model first`));
        return;
      }
      const spinner = ora("Fetching AI response...").start();
      // Call the AI function to generate a response based on the selected model
      const aiResponse = await getAIResponseFromModel(
        userInput,
        conversationHistory,
        config
      );
      spinner.stop();
      spinner.clear();
      if (aiResponse?.message) {
        let isExecuted = { success: false, error: null }; // Initial state
        let retryAttempts = 0; // Optional: To limit the number of retries

        // Keep trying until the task is successful or retry limit is reached
        if (aiResponse?.message) {
          let isExecuted = { success: false, error: null }; // Initial state
          let retryAttempts = 0; // Optional: To limit the number of retries
          let aiResponseMessage = aiResponse; // Use `let` to allow reassignment

          // Keep trying until the task is successful or retry limit is reached
          while (!isExecuted.success && retryAttempts < 5) {
            try {
              // Execute the commands
              isExecuted = await executeChainOfCommands(
                aiResponseMessage?.message
              );

              if (isExecuted.error) {
                console.error(
                  chalk.red(`Error executing commands: ${isExecuted.error}`)
                );
                // If there's an error, retry after getting an AI response
                aiResponseMessage = await getAIResponseFromModel(
                  isExecuted.error + userInput,
                  conversationHistory,
                  config
                );
              }

              if (isExecuted.success) {
                console.log(chalk.cyan(`Your task is successfully done!`));
                return isExecuted; // Exit the loop if successful
              }

              retryAttempts++;
              console.log(chalk.yellow(`Retrying attempt ${retryAttempts}...`));
            } catch (err) {
              console.error(chalk.red(`Unexpected error: ${err.message}`));
              break; // If an unexpected error occurs, break out of the loop
            }
          }

          // If the retry limit is reached
          if (!isExecuted.success) {
            console.log(
              chalk.red(
                `Failed to execute task after ${retryAttempts} attempts.`
              )
            );
          }
        }

        // If the retry limit is reached
        if (!isExecuted.success) {
          console.log(
            chalk.red(`Failed to execute task after ${retryAttempts} attempts.`)
          );
        }
      }

      if (aiResponse.error) {
        console.error(chalk.red(`Error: ${aiResponse.error}`));
      } else {
        console.log(chalk.cyan(`AI: ${aiResponse?.message}`));
      }

      // Append to conversation history
      conversationHistory.push({ user: userInput, ai: aiResponse });
      fs.writeFileSync(
        conversationHistoryPath,
        JSON.stringify(conversationHistory, null, 2)
      );
    }
  });

// Function to get AI response from the selected model
const getAIResponseFromModel = async (
  userInput,
  conversationHistory,
  config
) => {
  console.log(userInput);
  try {
    const { apiKey, instructions, model } = config;

    // Select the correct model URL
    let apiUrl = "";
    if (model === "gemini-1.5-flash") {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    } else if (model === "openai-gpt-3.5") {
      apiUrl = `https://api.openai.com/v1/completions`;
    } else {
      // Custom model handling can be added here
      apiUrl = `https://custom-api.com/${model}`;
    }

    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: instructions + userInput,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(model === "openai-gpt-3.5" && {
            Authorization: `Bearer ${apiKey}`,
          }),
        },
      }
    );
    // for gemini
    if (response?.data?.candidates[0]?.content?.parts[0]?.text) {
      console.log(response?.data?.candidates[0]?.content?.parts[0]?.text);
      return {
        message: response?.data?.candidates[0]?.content?.parts[0]?.text,
      };
    }
    // for openai-gpt-3.5
    if (response?.data?.choices[0]?.text) {
      return {
        message: response?.data?.choices[0]?.text.trim(),
      };
    } else if (response?.data?.candidates[0]?.content?.parts[0]?.text) {
      return {
        message: response?.data?.candidates[0]?.content?.parts[0]?.text,
      };
    } else {
      return { message: response.data };
    }
  } catch (error) {
    if (error?.response?.data?.error?.message) {
      return { error: error?.response?.data?.error?.message };
    }
    return { error: error || "Unexpected error" };
  }
};

program.parse(process.argv);
