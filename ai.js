const WORKER_URL = "https://mute-recipe-f796.sarthak-aaganja12.workers.dev/chat";

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
// ADD MESSAGE TO CHAT
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
// SEND MESSAGE
// ------------------------------
async function sendMessage() {
  const userInputEl = document.getElementById("userInput");
  if (!userInputEl) return;

  const userMessage = userInputEl.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  userInputEl.value = "";

  // Show "Thinking..."
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
    // Send simple JSON request
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    chatContainer.removeChild(thinking);

    if (response.ok && data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage("Error: " + (data.error || "Unknown error"), "bot");
    }
  } catch (error) {
    if (chatContainer.contains(thinking)) chatContainer.removeChild(thinking);
    addMessage("Error: " + error.message, "bot");
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
