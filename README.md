# 🌟 **help_ai**

_help_ai_ is an npm CLI tool designed to assist non-CLI developers and DevOps engineers in configuring and completing terminal tasks with a single prompt.

---

## ✨ **Features**

- **AI-Powered Assistance**

  - Leverage the Gemini 1.5 Flash model by default. You can acquire the API key from Google Gemini API.
  - It also supports OpenAI GPT-3.5, allowing flexibility in the model used.

- **Automatic Execution of Terminal Commands**

  - Handles individual commands or a series of operations across different terminal types (shell, bash, etc.).
  - Automatically executes terminal commands, removing the complexity of manual entry.

- **Advanced Debugging**
  - Identifies and resolves terminal issues by generating and running debugging commands.

---

## 🛠️ **How it Works?**

_help_ai_ is extremely user-friendly and works in a straightforward manner:

- **User Input**
  1. **User Input:** You provide a prompt describing your terminal task.
  2. **AI Processing:**The tool sends the prompt to the AI with default instructions. It receives a series of terminal commands in return.
  3. **Command Execution:** These commands are executed sequentially. In case of failure, the tool rolls back the changes and reverts to AI for new commands.
  4. **Retry Mechanism:** The process will repeat up to 5 times (this can be adjusted based on your needs) until the task is completed successfully.
  5. **Success Message:** Once successful, a completion message will be displayed to the user.

---

## 🚀 **Important Notes**

**\*Caution with Dangerous Prompts**
When using _help_ai_ in default mode, avoid entering commands that could potentially harm your system or disrupt important processes.

**Future Plans**
We are actively developing new features, including additional AI models and operational modes such as: - Debugging Mode - Safe Mode - Sandbox Mode
These modes will offer better safety, advanced debugging, and controlled environments for experimenting with terminal tasks.

---

## 📝 **Contributions and Feedback**

This package is still in its early stages of development. We encourage contributions from the community to enhance its functionality and performance. Please feel free to submit issues, improvements, or feature requests. Together, we can make _help_ai_ even better!

---

## 🧭 **Getting Started**

1. Install via npm:

   ```bash
   npm install -g help_ai

   ```

2. Make configuration (add api key, custom instruction, custom failure tries and select model):

   ```bash
   help_ai config

   ```

3. run ai:
   ```bash
    help_ai chat
   ```
