
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat");

// Add a message to the chat window
function addMessage(message, sender) {
    const div = document.createElement("div");

    div.className = `message ${sender}`;
    div.textContent = message;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    return div;
}

// Show an error message safely
function showError(message) {
    return addMessage(message, "bot");
}

// Send message to Flask backend
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) {
        return;
    }

    // Display user's message
    addMessage(message, "user");

    userInput.value = "";
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Display loading message
    const loading = addMessage("Thinking... 💭", "bot");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        // Read response as text first
        const responseText = await response.text();

        let data;

        // Safely parse JSON
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Invalid server response:", responseText);

            throw new Error(
                "The server returned an invalid response. Please try again."
            );
        }

        // Handle backend errors
        if (!response.ok) {
            throw new Error(
                data.reply || `Server error (${response.status})`
            );
        }

        // Display AI response
        if (data.reply) {
            loading.textContent = data.reply;
        } else {
            loading.textContent = "The AI did not return a response. Please try again.";
        }

    } catch (error) {
        console.error("Chatbot error:", error);

        loading.textContent = "⚠️ " + (
            error.message || "Something went wrong. Please try again."
        );

    } finally {
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();

        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Send button event
sendBtn.addEventListener("click", sendMessage);

// Enter key event
userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// New chat event
newChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = "";

    addMessage(
        "Hello! 👋 I'm your AI assistant. How can I help you?",
        "bot"
    );

    userInput.value = "";
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
});

// Initial welcome message (only if chat is empty)
if (chatBox.children.length === 0) {
    addMessage(
        "Hello! 👋 I'm your AI assistant. How can I help you?",
        "bot"
    );
}
