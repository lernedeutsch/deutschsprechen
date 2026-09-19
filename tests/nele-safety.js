const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(relativePath) {
  return fs.readFileSync(
    path.join(__dirname, "..", relativePath),
    "utf8"
  );
}

function check(condition, message) {
  assert.ok(condition, message);
  console.log("✓ " + message);
}

const html = read("nele.html");
const js = read("nele/nele.js");
const pronunciation = read("nele/nele-pronunciation.js");

check(
  html.includes('id="reset-btn"') &&
  html.includes("Neu anfangen"),
  "Neu anfangen button exists"
);

check(
  html.includes('id="new-user-btn"') &&
  html.includes("Als neuer Benutzer starten"),
  "new-user button exists"
);

check(
  !/fetch\(\s*[\`'"](?:\\\$\{this\.backendUrl\}|https?:\\\/\\\/[^\`'"]+)\\\/reset[\`'"]/m.test(js),
  "active Nele frontend never calls destructive /reset"
);

check(
  js.includes("startNewConversation") &&
  js.includes("await this.loadWelcome(") &&
  js.includes("true"),
  "Neu anfangen starts a fresh visible conversation"
);

check(
  js.includes("new_conversation:") &&
  js.includes("Boolean("),
  "Neu anfangen marks the welcome request as a new conversation"
);

check(
  js.includes('localStorage.removeItem(') &&
  js.includes('"nele_session_id"') &&
  js.includes("startAsNewUser"),
  "new-user flow replaces only the local learner identity"
);

check(
  js.includes('inputMode = "keyboard"') &&
  js.includes("input_mode:") &&
  js.includes("inputMode"),
  "chat payload carries input mode"
);

check(
  /sendMessage\(\s*"voice"\s*\)/m.test(js),
  "speech recognition sends voice input mode"
);

check(
  pronunciation.includes('"nele_session_id"'),
  "pronunciation keeps using the same learner identity key"
);

check(
  js.includes("https://nele-backend.onrender.com"),
  "frontend points to the production Nele backend"
);

console.log("\nAll Nele frontend safety tests passed.");
