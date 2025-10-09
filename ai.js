
const SECRET_KEY = "Z8fL3mQ1bR9xT7cD"; // Must match backend
const WORKER_URL = "https://mute-recipe-f796.sarthak-aaganja12.workers.dev/chat";

// ------------------------------
// UTILITY: HMAC GENERATION
// ------------------------------
async function generateHMAC(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature))); // Base64 encode
}

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

// Append chat container safely
document.addEventListener("DOMContentLoaded", () => {
  (document.querySelector("main") || document.body).appendChild(chatContainer);
});

// Function to add messages
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
// SEND MESSAGE
// ------------------------------
async function sendMessage() {
  const userInputEl = document.getElementById("userInput");
  if (!userInputEl) return;

  const userMessage = userInputEl.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  userInputEl.value = "";

  // Show thinking
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
    // Generate timestamp & HMAC
    const timestamp = Date.now();
    const message = `frontend-${timestamp}`;
    const signature = await generateHMAC(SECRET_KEY, message);

    // Send request
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Timestamp": timestamp.toString(),
        "X-Signature": signature,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    chatContainer.removeChild(thinking);

    if (response.ok) {
      addMessage(data.reply, "bot");
    } else {
      addMessage(" Error: " + (data.error || "Unknown error"), "bot");
    }
  } catch (error) {
    if (chatContainer.contains(thinking)) chatContainer.removeChild(thinking);
    addMessage(" Error: " + error.message, "bot");
  }
}

// ------------------------------
// EVENT LISTENERS
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

