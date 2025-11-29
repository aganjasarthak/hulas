const WORKER_URL = "https://aganjasarthak.sarthak-aaganja12.workers.dev/chat";
const FALLBACK_URL = "https://api.aganjasarthak.com.np/api/generate";

// ------------------------------
// CHAT UI SETUP
// ------------------------------
const chatContainer = document.createElement("div");
chatContainer.style.maxWidth = "900px";
chatContainer.style.width = "100%";
chatContainer.style.margin = "0 auto";
chatContainer.style.flex = "1";
chatContainer.style.display = "flex";
chatContainer.style.flexDirection = "column";
chatContainer.style.gap = "0.75rem";
chatContainer.style.padding = "1rem";
chatContainer.style.overflowY = "auto";
chatContainer.style.scrollBehavior = "smooth";

document.addEventListener("DOMContentLoaded", () => {
  (document.querySelector("main") || document.body).appendChild(chatContainer);
});

// ------------------------------
// ADD MESSAGE
// ------------------------------
function addMessage(text, type = "bot") {
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.padding = "0.75rem 1rem";
  msg.style.borderRadius = "0.75rem";
  msg.style.maxWidth = "75%";
  msg.style.wordWrap = "break-word";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.alignSelf = type === "user" ? "flex-end" : "flex-start";
  msg.style.background = type === "user" ? "var(--btn-bg)" : "var(--card)";
  msg.style.color = type === "user" ? "var(--btn-text)" : "var(--text)";
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ------------------------------
// SEND REQUEST HELPERS
// ------------------------------
async function sendToPrimary(message) {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const json = await res.json();
  return { ok: res.ok, data: json };
}

async function sendToFallback(message) {
  const res = await fetch(FALLBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userMessage: message })
  });
  const json = await res.json();
  return { ok: res.ok, data: { reply: json.response } };
}

// ------------------------------
// MAIN SEND MESSAGE LOGIC
// ------------------------------
async function sendMessage() {
  const userInputEl = document.getElementById("userInput");
  if (!userInputEl) return;

  const userMessage = userInputEl.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  userInputEl.value = "";

  // Thinking...
  const thinking = document.createElement("div");
  thinking.textContent = "Thinking...";
  thinking.style.opacity = "0.7";
  thinking.style.padding = "0.75rem 1rem";
  thinking.style.borderRadius = "0.75rem";
  thinking.style.background = "var(--card)";
  thinking.style.color = "var(--text)";
  chatContainer.appendChild(thinking);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // PRIMARY REQUEST
    let result = await sendToPrimary(userMessage);

    // ✅ Detect “Resources exhausted” EVEN IF inside data.error
    const exhausted =
      result.data?.error?.toLowerCase().includes("exhausted") ||
      result.data?.reply?.toLowerCase().includes("exhausted");

    // FALLBACK if primary fails OR exhausted
    if (!result.ok || exhausted) {
      result = await sendToFallback(userMessage);
    }

    chatContainer.removeChild(thinking);

    if (result.ok && result.data.reply) {
      addMessage(result.data.reply.replace(/\*/g, ""), "bot");
    } else {
      addMessage("Error: " + (result.data.error || "Unknown error"), "bot");
    }
  } catch (error) {
    if (chatContainer.contains(thinking)) chatContainer.removeChild(thinking);
    addMessage("Error: " + error.message, "bot");
  }
}

// ------------------------------
// EVENTS
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");

  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
