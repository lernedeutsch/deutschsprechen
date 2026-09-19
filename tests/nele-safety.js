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


const legacyHtml = read("nele.1.html");

check(
  !legacyHtml.includes("nele-backend-3.onrender.com") &&
  !legacyHtml.includes("nele3_student_id") &&
  !legacyHtml.includes("localStorage."),
  "legacy nele.1.html cannot create a second learner identity"
);

check(
  legacyHtml.includes("nele.html") &&
  legacyHtml.includes("https://lernedeutsch.github.io/deutschsprechen/nele.html"),
  "legacy nele.1.html points only to canonical Nele"
);


check(
  js.includes('"nele_session_id"') &&
  pronunciation.includes('"nele_session_id"') &&
  !js.includes("nele_student_id") &&
  !js.includes("nele3_student_id") &&
  !pronunciation.includes("nele_student_id") &&
  !pronunciation.includes("nele3_student_id"),
  "active frontend uses exactly one learner identity key"
);

check(
  !html.includes("nele-backend-3.onrender.com") &&
  !js.includes("nele-backend-3.onrender.com") &&
  !pronunciation.includes("nele-backend-3.onrender.com"),
  "active frontend cannot connect to backend-3"
);


check(
  pronunciation.includes("/api/activity/start") &&
  pronunciation.includes('"pronunciation"') &&
  pronunciation.includes("preparePronunciationTask") &&
  pronunciation.includes("pronunciationTaskReady"),
  "pronunciation starts a backend pronunciation task before recording"
);

check(
  pronunciation.includes('formData.append(') &&
  pronunciation.includes('"input_mode"') &&
  pronunciation.includes('"voice"'),
  "pronunciation audio is explicitly sent as voice input"
);

check(
  !pronunciation.includes('return "default"'),
  "pronunciation never falls back to shared default learner id"
);

check(
  js.includes("window.NELE_BACKEND_URL") &&
  pronunciation.includes("window.NELE_BACKEND_URL") &&
  js.includes("https://nele-backend.onrender.com") &&
  pronunciation.includes("https://nele-backend.onrender.com"),
  "frontend supports test override but keeps production backend as default"
);

check(
  js.includes('new CustomEvent("nele:new-conversation")') &&
  pronunciation.includes('"nele:new-conversation"'),
  "new conversation resets pronunciation task state"
);
