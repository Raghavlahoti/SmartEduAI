document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chat-window");
  const userInput = document.getElementById("userInput");
  const newChatBtn = document.querySelector(".new-chat-btn");
  const previousChatsContainer = document.getElementById("previous-chats"); // More descriptive name
  const chatList = document.getElementById("chat-list") || previousChatsContainer; // Fallback in case of HTML change
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");

  let currentSessionId = Date.now().toString();
  let sessions = JSON.parse(localStorage.getItem("sessions")) || {};

  // --- Helper Functions ---

  const scrollToBottom = () => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const updateLocalStorageSessions = () => {
      localStorage.setItem("sessions", JSON.stringify(sessions));
  };

  const createMessageElement = (message, type) => {
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message", type === "user" ? "user-msg" : "bot-msg");
      msgDiv.textContent = message;
      msgDiv.setAttribute('data-message-type', type); // Useful for potential future styling or logic
      return msgDiv;
  };

  const displayMessage = (message, type = "bot") => {
      const msgElement = createMessageElement(message, type);
      chatWindow.appendChild(msgElement);
      scrollToBottom();

      if (!sessions[currentSessionId]) {
          sessions[currentSessionId] = { messages: [], name: "Untitled Chat" }; // Initialize with a default name
      }
      sessions[currentSessionId].messages.push({ text: message, type });
      updateLocalStorageSessions();
  };

  const fetchChatResponse = async (prompt) => {
      try {
          const response = await fetch("http://localhost:5000/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }),
          });
          const data = await response.json();
          return data.reply || "No response from server.";
      } catch (error) {
          console.error("Fetch error:", error);
          return "Sorry, something went wrong.";
      }
  };

  // --- Session Management ---

  const getSessionTitle = (session) => {
      return session.name || session.messages.find((msg) => msg.type === "user")?.text.slice(0, 30) || "Untitled Chat";
  };

  const createSessionButton = (sessionId) => {
      const session = sessions[sessionId];
      if (!session || !session.messages || session.messages.length === 0) return null;

      const btnContainer = document.createElement("div");
      btnContainer.className = "session-btn-container";

      const btn = document.createElement("div");
      btn.className = "session-btn";
      btn.textContent = getSessionTitle(session);
      btn.style.cursor = "pointer";
      btn.onclick = () => loadSession(sessionId);

      const buttonGroup = document.createElement("div");
      buttonGroup.className = "button-group";

      const createActionButton = (text, onClick) => {
          const actionBtn = document.createElement("button");
          actionBtn.textContent = text;
          actionBtn.onclick = onClick;
          return actionBtn;
      };

      const renameBtn = createActionButton("✎", (e) => {
          e.stopPropagation();
          renameSession(sessionId);
      });
      renameBtn.className = "rename-btn";

      const deleteBtn = createActionButton("✖", (e) => {
          e.stopPropagation();
          deleteSession(sessionId);
      });
      deleteBtn.className = "delete-btn";

      buttonGroup.appendChild(renameBtn);
      buttonGroup.appendChild(deleteBtn);

      btnContainer.appendChild(btn);
      btnContainer.appendChild(buttonGroup);
      return btnContainer;
  };

  const loadPreviousChats = () => {
      if (!chatList) {
          console.error("Chat list element not found.");
          return;
      }
      chatList.innerHTML = ""; // Clear previous list
      const sortedSessionIds = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a)); // Sort by most recent
      sortedSessionIds.forEach(id => {
          const button = createSessionButton(id);
          if (button) {
              chatList.appendChild(button);
          }
      });
      if (Object.keys(sessions).length > 0) {
          previousChatsContainer.style.display = 'block'; // Show the container if there are chats
      } else {
          previousChatsContainer.style.display = 'none'; // Hide if no chats
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
          loadPreviousChats();
          if (Object.keys(sessions).length === 0) {
              startNewChat(); // Optionally start a new chat if all are deleted
          } else if (currentSessionId === sessionId) {
              const latestSessionId = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a))[0];
              if (latestSessionId) {
                  loadSession(latestSessionId);
              } else {
                  startNewChat();
              }
          }
      }
  };

  const loadSession = (sessionId) => {
      currentSessionId = sessionId;
      chatWindow.innerHTML = "";
      if (sessions[sessionId] && sessions[sessionId].messages) {
          sessions[sessionId].messages.forEach(({ text, type }) => displayMessage(text, type));
      }
  };

  const startNewChat = () => {
      currentSessionId = Date.now().toString();
      chatWindow.innerHTML = `<div class="message bot-msg">Hello! Ask me anything.</div>`;
      sessions[currentSessionId] = { messages: [], name: "Untitled Chat" };
      updateLocalStorageSessions();
      loadPreviousChats(); // Refresh the list to include the new session
  };

  // --- User Interaction ---

  const sendMessage = async () => {
      const input = userInput.value.trim();
      if (!input) return;

      displayMessage(input, "user");
      userInput.value = "";

      const botReply = await fetchChatResponse(input);
      displayMessage(botReply, "bot");
  };

  window.handleApiCall = async (action) => {
      const inputText = userInput.value.trim();
      if (!inputText) return;

      let promptText = "";
      switch (action) {
          case "Translate":
              promptText = `Translate this sentence into Hindi: ${inputText}`;
              break;
          case "Generate Questions":
              promptText = `Generate questions based on: ${inputText}`;
              break;
          case "Explain":
              promptText = `Explain this: ${inputText}`;
              break;
          case "Code Explanation":
              promptText = `Explain this code: ${inputText}`;
              break;
          case "Assignment":
              promptText = `Create an assignment on: ${inputText}`;
              break;
          case "Get Answer":
              promptText = `Answer this: ${inputText}`;
              break;
          case "Summarize":
              promptText = `Summarize this: ${inputText}`;
              break;
          case "Easy Language":
              promptText = `Explain in easy language: ${inputText}`;
              break;
          case "Meaning":
              promptText = `What is the meaning of: ${inputText}`;
              break;
          default:
              promptText = inputText;
      }

      displayMessage(promptText, "user");
      userInput.value = "";

      const botReply = await fetchChatResponse(promptText);
      displayMessage(botReply, "bot");
  };

  // --- Voice Input ---

  window.startVoice = () => {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
          userInput.value = event.results[0][0].transcript;
          sendMessage();
      };

      recognition.onerror = (event) => {
          console.error("Voice error:", event.error);
          displayMessage(`Voice error: ${event.error}`, "bot");
      };

      recognition.start();
  };

  // --- Event Listeners ---

  userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { // Prevent send on Shift+Enter for new lines (if you intend to support)
          e.preventDefault();
          sendMessage();
      }
  });

  newChatBtn.addEventListener("click", startNewChat);
  sendBtn.addEventListener('click', sendMessage);
  voiceBtn.addEventListener('click', startVoice);

  // --- Initialization ---

  loadPreviousChats();
  if (Object.keys(sessions).length > 0) {
      const latestSessionId = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a))[0];
      loadSession(latestSessionId);
  }
});