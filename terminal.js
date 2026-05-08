const outputEl = document.getElementById("output");
const inputEl = document.getElementById("cmd");

let history = [];
let historyIndex = 0;
let privilegeLevel = 0;

const FS = {
  "readme.txt": "System terminal\nType 'help' to begin.",
  "auth.log": "[WARN] Failed login attempt from 127.0.0.1",
  "public.key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  ".hidden": "You're looking in the right place."
};

function print(line = "") {
  const div = document.createElement("div");
  div.textContent = line;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function runCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  print(`guest@node:~$ ${input}`);
  history.push(input);
  historyIndex = history.length;

  const [cmd, ...args] = input.split(/\s+/);

  switch (cmd) {
    case "help":
      print("Available commands:");
      print("  help      - show this help");
      print("  ls        - list files");
      print("  cat FILE  - show file contents");
      print("  clear     - clear screen");
      print("  status    - system status");
      break;

    case "ls":
      print(Object.keys(FS).join("  "));
      break;

    case "cat":
      if (!args[0]) {
        print("Usage: cat <file>");
        break;
      }
      if (FS[args[0]] !== undefined) {
        print(FS[args[0]]);
      } else {
        print(`cat: ${args[0]}: No such file`);
      }
      break;

    case "clear":
      outputEl.innerHTML = "";
      break;

    case "status":
      print("System nominal.");
      break;

    default:
      print(`${cmd}: command not found`);
  }
}

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runCommand(inputEl.value);
    inputEl.value = "";
  } else if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      inputEl.value = history[historyIndex] || "";
      setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
    }
  } else if (e.key === "ArrowDown") {
    if (historyIndex < history.length) {
      historyIndex++;
      inputEl.value = history[historyIndex] || "";
      setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
    }
  }
});

// initial message
print("guest@node:~$");
print("Type 'help' to begin.");
