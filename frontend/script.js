document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chat-window");
  const userInput = document.getElementById("userInput");
  const newChatBtn = document.getElementById("newChatBtn");
  const previousChatsContainer = document.getElementById("previous-chats");
  const chatList = document.getElementById("chat-list") || previousChatsContainer;
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const actionButtons = document.querySelectorAll(".action-buttons button[data-action]");

  let currentSessionId = Date.now().toString();
  let sessions = JSON.parse(localStorage.getItem("sessions")) || {};

  // --- Helper & Utility Functions ---

  const scrollToBottom = () => {
    chatWindow.scrollTo({
      top: chatWindow.scrollHeight,
      behavior: "smooth",
    });
  };

  const updateLocalStorageSessions = () => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  };

  const sanitizeAndParseMarkdown = (text) => {
    if (!text) return "";
    let rawHtml = window.marked ? window.marked.parse(text) : text;
    // Sanitize parsed HTML using DOMPurify if available to prevent XSS
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(rawHtml);
    }
    // Basic fallback HTML escaping if DOMPurify isn't loaded
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  };

  const createMessageElement = (message, type) => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type === "user" ? "user-msg" : "bot-msg");
    msgDiv.setAttribute("data-message-type", type);

    if (type === "bot") {
      msgDiv.innerHTML = sanitizeAndParseMarkdown(message);
    } else {
      msgDiv.textContent = message;
    }

    return msgDiv;
  };

  const displayMessage = (message, type = "bot", saveToHistory = true) => {
    const msgElement = createMessageElement(message, type);
    chatWindow.appendChild(msgElement);
    scrollToBottom();

    if (saveToHistory) {
      if (!sessions[currentSessionId]) {
        sessions[currentSessionId] = { messages: [], name: "New Chat" };
      }
      sessions[currentSessionId].messages.push({ text: message, type });
      updateLocalStorageSessions();
    }
    return msgElement;
  };

  const showLoadingIndicator = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message bot-msg loading-dots";
    loadingDiv.id = "activeLoadingIndicator";
    loadingDiv.setAttribute("aria-label", "AI is processing your query");
    loadingDiv.innerHTML = `<span class="dots"><span>.</span><span>.</span><span>.</span> AI is thinking</span>`;
    chatWindow.appendChild(loadingDiv);
    scrollToBottom();
  };

  const removeLoadingIndicator = () => {
    const loadingDiv = document.getElementById("activeLoadingIndicator");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  };

  const getApiEndpoint = () => {
    if (window.location.protocol.startsWith("http")) {
      return `${window.location.origin}/chat`;
    }
    return "http://127.0.0.1:5000/chat";
  };

  const fetchChatResponse = async (prompt) => {
    try {
      showLoadingIndicator();
      const response = await fetch(getApiEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      removeLoadingIndicator();

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return errData.reply || `Server error (${response.status}). Please try again.`;
      }

      const data = await response.json();
      return data.reply || "No response received from server.";
    } catch (error) {
      removeLoadingIndicator();
      console.error("Fetch error:", error);
      return "⚠️ Unable to connect to backend server. Make sure the server is running.";
    }
  };

  // --- Session Management & Keyboard Navigation ---

  const getSessionTitle = (session) => {
    if (session.name && session.name !== "New Chat" && session.name !== "Untitled Chat") {
      return session.name;
    }
    const firstUserMsg = session.messages.find((msg) => msg.type === "user");
    return firstUserMsg ? firstUserMsg.text.slice(0, 28) + (firstUserMsg.text.length > 28 ? "..." : "") : "Untitled Chat";
  };

  const pruneEmptySessions = () => {
    let modified = false;
    Object.keys(sessions).forEach((id) => {
      if (!sessions[id].messages || sessions[id].messages.length === 0) {
        delete sessions[id];
        modified = true;
      }
    });
    if (modified) updateLocalStorageSessions();
  };

  const createSessionButton = (sessionId) => {
    const session = sessions[sessionId];
    if (!session || !session.messages || session.messages.length === 0) return null;

    const btnContainer = document.createElement("div");
    btnContainer.className = `session-btn-container ${sessionId === currentSessionId ? "active-session" : ""}`;
    btnContainer.setAttribute("role", "listitem");

    const btn = document.createElement("div");
    btn.className = "session-btn";
    btn.textContent = getSessionTitle(session);
    btn.title = btn.textContent;
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", `Load chat session: ${btn.textContent}`);

    btn.onclick = () => loadSession(sessionId);
    btn.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        loadSession(sessionId);
      }
    };

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const createActionButton = (text, onClick, title, ariaLabel) => {
      const actionBtn = document.createElement("button");
      actionBtn.textContent = text;
      actionBtn.title = title;
      actionBtn.setAttribute("aria-label", ariaLabel);
      actionBtn.onclick = onClick;
      return actionBtn;
    };

    const renameBtn = createActionButton(
      "✎",
      (e) => {
        e.stopPropagation();
        renameSession(sessionId);
      },
      "Rename chat",
      `Rename session ${btn.textContent}`
    );
    renameBtn.className = "rename-btn";

    const deleteBtn = createActionButton(
      "✖",
      (e) => {
        e.stopPropagation();
        deleteSession(sessionId);
      },
      "Delete chat",
      `Delete session ${btn.textContent}`
    );
    deleteBtn.className = "delete-btn";

    buttonGroup.appendChild(renameBtn);
    buttonGroup.appendChild(deleteBtn);

    btnContainer.appendChild(btn);
    btnContainer.appendChild(buttonGroup);
    return btnContainer;
  };

  const loadPreviousChats = () => {
    if (!chatList) return;
    pruneEmptySessions();
    chatList.innerHTML = "";

    const sortedSessionIds = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a));
    sortedSessionIds.forEach((id) => {
      const button = createSessionButton(id);
      if (button) {
        chatList.appendChild(button);
      }
    });

    if (Object.keys(sessions).length > 0) {
      previousChatsContainer.style.display = "block";
    } else {
      previousChatsContainer.style.display = "none";
    }
  };

  const renameSession = (sessionId) => {
    const currentSession = sessions[sessionId];
    const defaultName = getSessionTitle(currentSession);
    const newName = prompt("Enter a new name for this chat:", defaultName);
    if (newName && newName.trim()) {
      if (!sessions[sessionId]) sessions[sessionId] = { messages: [], name: newName.trim() };
      sessions[sessionId].name = newName.trim();
      updateLocalStorageSessions();
      loadPreviousChats();
    }
  };

  const deleteSession = (sessionId) => {
    if (confirm("Are you sure you want to delete this chat history?")) {
      delete sessions[sessionId];
      updateLocalStorageSessions();

      if (Object.keys(sessions).length === 0) {
        startNewChat();
      } else if (currentSessionId === sessionId) {
        const latestSessionId = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a))[0];
        if (latestSessionId) {
          loadSession(latestSessionId);
        } else {
          startNewChat();
        }
      } else {
        loadPreviousChats();
      }
    }
  };

  const loadSession = (sessionId) => {
    currentSessionId = sessionId;
    chatWindow.innerHTML = "";
    if (sessions[sessionId] && sessions[sessionId].messages) {
      sessions[sessionId].messages.forEach(({ text, type }) =>
        displayMessage(text, type, false)
      );
    }
    loadPreviousChats();
  };

  const startNewChat = () => {
    pruneEmptySessions();
    currentSessionId = Date.now().toString();
    chatWindow.innerHTML = "";
    displayMessage("Hello! Ask me anything.", "bot", false);
    sessions[currentSessionId] = { messages: [], name: "New Chat" };
    loadPreviousChats();
  };

  // --- User Interaction & Action Handlers ---

  const sendMessage = async () => {
    const input = userInput.value.trim();
    if (!input) return;

    displayMessage(input, "user");
    userInput.value = "";

    const botReply = await fetchChatResponse(input);
    displayMessage(botReply, "bot");
    loadPreviousChats();
  };

  const handleAction = async (action) => {
    const inputText = userInput.value.trim();
    if (!inputText) {
      userInput.classList.add("input-error");
      userInput.focus();
      setTimeout(() => userInput.classList.remove("input-error"), 1200);
      return;
    }

    let promptText = "";
    switch (action) {
      case "Translate":
        promptText = `Translate this sentence into Hindi: ${inputText}`;
        break;
      case "Generate Questions":
        promptText = `Generate study questions based on: ${inputText}`;
        break;
      case "Explain":
        promptText = `Explain this in detail: ${inputText}`;
        break;
      case "Code Explanation":
        promptText = `Explain this code line-by-line: ${inputText}`;
        break;
      case "Assignment":
        promptText = `Create an educational assignment on: ${inputText}`;
        break;
      case "Get Answer":
        promptText = `Provide a clear answer to: ${inputText}`;
        break;
      case "Summarize":
        promptText = `Summarize key points of: ${inputText}`;
        break;
      case "Easy Language":
        promptText = `Explain in simple, easy-to-understand language: ${inputText}`;
        break;
      case "Meaning":
        promptText = `What is the detailed definition and meaning of: ${inputText}`;
        break;
      default:
        promptText = inputText;
    }

    displayMessage(promptText, "user");
    userInput.value = "";

    const botReply = await fetchChatResponse(promptText);
    displayMessage(botReply, "bot");
    loadPreviousChats();
  };

  // --- Voice Input ---

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      voiceBtn.classList.add("voice-recording");
      voiceBtn.title = "Listening...";

      recognition.onresult = (event) => {
        voiceBtn.classList.remove("voice-recording");
        userInput.value = event.results[0][0].transcript;
        sendMessage();
      };

      recognition.onerror = (event) => {
        voiceBtn.classList.remove("voice-recording");
        console.error("Voice error:", event.error);
        displayMessage(`Voice input error: ${event.error}`, "bot", false);
      };

      recognition.onend = () => {
        voiceBtn.classList.remove("voice-recording");
      };

      recognition.start();
    } catch (err) {
      voiceBtn.classList.remove("voice-recording");
      console.error("Speech recognition launch failed:", err);
    }
  };

  // --- Event Listeners ---

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (voiceBtn) voiceBtn.addEventListener("click", startVoice);

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-action");
      if (action) handleAction(action);
    });
  });

  // --- Initialization ---

  if (Object.keys(sessions).length > 0) {
    const latestSessionId = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a))[0];
    loadSession(latestSessionId);
  } else {
    startNewChat();
  }
});