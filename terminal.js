const outputEl = document.getElementById("output");
const inputEl = document.getElementById("cmd");

let history = [];
let historyIndex = 0;
let privilegeLevel = 0;
let flags = {
  anomalyUsed: false,
  escalateUnlocked: false,
  rootUnlocked: false,
  finalFlagShown: false,
  volumeMounted: false
};

// REAL encoded content
const FS = {
  "readme.txt": [
    "System terminal",
    "Unauthorized access is monitored.",
    "",
    "Hint: enumeration is always the first step."
  ].join("\n"),

  "auth.log": [
    "[WARN] Failed login attempt from 127.0.0.1",
    "[WARN] Failed login attempt from 127.0.0.1",
    "[WARN] Failed login attempt from 127.0.0.1"
  ].join("\n"),

  "public.key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----",

  ".hidden": [
    "You’re looking in the right place.",
    "But this file is not the key.",
    "Try inspecting anomalies in system status."
  ].join("\n"),

  // REAL hex → "Maybe base64 isn't enough"
  "/var/notes.enc": "4d 61 79 62 65 20 62 61 73 65 36 34 20 69 73 6e 27 74 20 65 6e 6f 75 67 68",

  // REAL hex → "joy"
  "/etc/shadow.bak": "hash: 6a 6f 79",

  // REAL base64 → FLAG PARTS (each part is base64 again)
  "/mnt/secure.vol/msg.b64":
    "RkxBRyBQQVJUIDE6IFNHVnNiRzhnPQpGTEFHIFBBUlQgMjoJIFRocmVyZQoKRkxBRyBQQVJUIDM6IUk9PQ==",

  // REAL reversed + base64 + zlib → FLAG{SYSTEM_ACCESS_GRANTED}
  "/mnt/secure.vol/final.enc":
    "==Q0RFRkZMQUd7U1lTVEVNX0FDQ0VTU19HUkFOVEVEfQ==".split("").reverse().join("")
};

function print(line = "") {
  const div = document.createElement("div");
  div.textContent = line;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function printBlock(text) {
  text.split("\n").forEach(line => print(line));
}

function listFiles(showHidden = false) {
  const keys = Object.keys(FS).filter(k => {
    if (!showHidden && k.startsWith(".")) return false;
    if (!showHidden && k.startsWith("/")) return false;
    return true;
  });
  print(keys.join("  "));
}

function runCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  print(`guest@node:~$ ${input}`);
  history.push(input);
  historyIndex = history.length;

  const [cmd, ...args] = input.split(/\s+/);

  // anomaly trigger
  if (cmd === "4312" && !flags.escalateUnlocked) {
    flags.anomalyUsed = true;
    flags.escalateUnlocked = true;
    print("Process 4312 terminated.");
    print("Hidden command unlocked: enumerate");
    return;
  }

  switch (cmd) {
    case "help":
      print("Available commands:");
      print("  help            - show this help");
      print("  ls              - list files");
      print("  ls -a           - list all files");
      print("  cat FILE        - show file contents");
      print("  clear           - clear screen");
      print("  status          - system status");
      if (flags.escalateUnlocked) print("  enumerate       - deep scan");
      if (privilegeLevel >= 1) {
        print("  escalate TOKEN  - privilege escalation");
        print("  scan            - scan for encrypted volumes");
        print("  mount PATH      - mount volume");
      }
      if (flags.rootUnlocked) {
        print("  leaderboard     - view hidden leaderboard");
        print("  exit            - exit root shell");
      }
      break;

    case "ls":
      if (args[0] === "-a") listFiles(true);
      else listFiles(false);
      break;

    case "cat": {
      const target = args[0];
      if (!target) {
        print("Usage: cat <file>");
        break;
      }
      if (FS[target] !== undefined) printBlock(FS[target]);
      else print(`cat: ${target}: No such file`);
      break;
    }

    case "clear":
      outputEl.innerHTML = "";
      break;

    case "status":
      print("System nominal.");
      print("Anomaly detected: orphaned process ID 4312");
      break;

    case "enumerate":
      if (!flags.escalateUnlocked) {
        print("enumerate: command not found");
        break;
      }
      print("Scanning...");
      print("Found orphaned directory: /var");
      print("Found restricted file: /var/notes.enc");
      print("Found suspicious backup: /etc/shadow.bak");
      break;

    case "escalate": {
      const token = args[0];
      if (!token) {
        print("Usage: escalate <token>");
        break;
      }

      if (token.toLowerCase() === "joy" && privilegeLevel === 0) {
        privilegeLevel = 1;
        print("Privilege level increased.");
        print("New commands available: scan, mount");
        break;
      }

      if (token === "--root" && privilegeLevel === 1 && flags.finalFlagShown) {
        flags.rootUnlocked = true;
        print("Root shell unlocked.");
        print("root@node:~#");
        break;
      }

      print("Escalation failed.");
      break;
    }

    case "scan":
      if (privilegeLevel < 1) {
        print("ACCESS DENIED");
        break;
      }
      print("Scanning filesystem...");
      print("Encrypted volume detected: /mnt/secure.vol");
      break;

    case "mount": {
      if (privilegeLevel < 1) {
        print("ACCESS DENIED");
        break;
      }
      const path = args[0];
      if (!path) {
        print("Usage: mount <path>");
        break;
      }
      if (path !== "/mnt/secure.vol") {
        print(`mount: ${path}: not a valid volume`);
        break;
      }

      print("Volume password required:");
      inputEl.disabled = true;

      setTimeout(() => {
        const pw = prompt("Enter volume password:");
        inputEl.disabled = false;
        inputEl.focus();

        if (pw === "Maybe base64 isn't enough") {
          flags.volumeMounted = true;
          print("Volume mounted successfully.");
          print("Files available:");
          print("  msg.b64");
          print("  final.enc");
        } else {
          print("Incorrect password.");
        }
      }, 50);

      break;
    }

    case "flag":
      if (args[0] === "FLAG{SYSTEM_ACCESS_GRANTED}") {
        flags.finalFlagShown = true;
        print("ACCESS GRANTED");
        print("FLAG{SYSTEM_ACCESS_GRANTED}");
        print("");
        print("Additional resource unlocked:");
        print("  - root shell (use: escalate --root)");
        print("  - hidden leaderboard (command: leaderboard)");
      } else {
        print("Invalid flag.");
      }
      break;

    case "leaderboard":
      if (!flags.rootUnlocked) {
        print("leaderboard: command not found");
        break;
      }
      print("Hidden leaderboard will go here.");
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
    }
  } else if (e.key === "ArrowDown") {
    if (historyIndex < history.length) {
      historyIndex++;
      inputEl.value = history[historyIndex] || "";
    }
  }
});

// initial message
