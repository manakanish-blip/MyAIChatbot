
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat");

function addMessage(message, sender) {
    const div = document.createElement("div");

    div.className = `message ${sender}`;
    div.textContent = message;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    return div;
}

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;

    addMessage(message, "user");
    userInput.value = "";

    sendBtn.disabled = true;
    const loading = addMessage("Thinking...", "bot");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reply || "Something went wrong.");
        }

        loading.textContent = data.reply || "No response received.";

    } catch (error) {
        loading.textContent = "Error: " + error.message;

    } finally {
        sendBtn.disabled = false;
        userInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

newChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = "";

    addMessage(
        "Hello! 👋 I'm your AI assistant. How can I help you?",
        "bot"
    );
});
