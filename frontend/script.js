document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const chatWindow = document.getElementById("chat-window");
  const userInput = document.getElementById("userInput");
  const newChatBtn = document.getElementById("newChatBtn");
  const previousChatsContainer = document.getElementById("previous-chats");
  const chatList = document.getElementById("chat-list") || previousChatsContainer;
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const voiceStatusToast = document.getElementById("voiceStatusToast");

  // Navigation Links
  const navChatBtn = document.getElementById("navChatBtn");
  const navTemplatesBtn = document.getElementById("navTemplatesBtn");
  const exportChatBtn = document.getElementById("exportChatBtn");
  const navSettingsBtn = document.getElementById("navSettingsBtn");
  const shortcutCards = document.querySelectorAll(".shortcut-card");

  // Persona Switcher Tabs
  const personaTabs = document.querySelectorAll(".persona-tab");
  const activeModeBadge = document.getElementById("activeModeBadge");
  let currentPersonaMode = "student";

  // Search
  const searchChatsInput = document.getElementById("searchChatsInput");

  // Mobile Sidebar Drawer
  const sidebarLeft = document.getElementById("sidebarLeft");
  const mobileToggleBtn = document.getElementById("mobileToggleBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  // Settings & Templates Modals
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const customSystemPromptInput = document.getElementById("customSystemPrompt");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const clearAllChatsBtn = document.getElementById("clearAllChatsBtn");

  const templatesModal = document.getElementById("templatesModal");
  const closeTemplatesBtn = document.getElementById("closeTemplatesBtn");
  const templateTabs = document.querySelectorAll(".template-tab");
  const templateGrid = document.getElementById("templateGrid");

  // File Upload & OCR Attachment
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  const fileInput = document.getElementById("fileInput");
  const filePreviewContainer = document.getElementById("filePreviewContainer");
  let attachedFileContent = null;
  let attachedFileName = null;

  // Active State & Abort Controller
  let activeAbortController = null;
  let speechRecognition = null;
  let isListening = false;

  let currentSessionId = Date.now().toString();
  let sessions = JSON.parse(localStorage.getItem("sessions")) || {};

  // Persona Prompts Mapping
  const PERSONA_LABELS = {
    student: "🎓 Student Mode",
    teacher: "🍎 Teacher Mode",
    developer: "💻 Developer Mode",
  };

  // Prompt Templates Data
  const PROMPT_TEMPLATES = {
    student: [
      { title: "💡 Concept Analogy", prompt: "Explain the core concept of [Topic] using a real-world everyday analogy." },
      { title: "🃏 Flashcards Generator", prompt: "Generate 10 Q&A flashcards for reviewing [Topic] before an exam." },
      { title: "🧠 Memory Hooks", prompt: "Create memorable mnemonics to help me memorize key facts about [Topic]." },
    ],
    teacher: [
      { title: "📝 Quiz & Test Paper", prompt: "Generate a 10-question quiz (5 Multiple Choice, 5 Short Answer) on [Topic] with answer key." },
      { title: "📚 Lesson Plan Generator", prompt: "Create a 45-minute interactive lesson plan for teaching [Topic] to high school students." },
      { title: "📊 Grading Rubric", prompt: "Design a 4-level evaluation rubric for assessing student projects on [Topic]." },
    ],
    developer: [
      { title: "💻 Code Explanation", prompt: "Explain this code snippet line-by-line, detailing variable states and logic flow:\n\n" },
      { title: "🐞 Bug Detector & Fix", prompt: "Analyze this code for potential bugs, edge cases, or performance bottlenecks, and provide refactored code:\n\n" },
      { title: "🧪 Unit Test Generator", prompt: "Generate comprehensive unit tests for the following function:\n\n" },
    ],
  };

  // --- Mobile Sidebar Drawer Handlers ---
  const openMobileSidebar = () => {
    if (sidebarLeft) sidebarLeft.classList.add("mobile-open");
    if (sidebarOverlay) sidebarOverlay.classList.add("show");
  };
  const closeMobileSidebar = () => {
    if (sidebarLeft) sidebarLeft.classList.remove("mobile-open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("show");
  };
  if (mobileToggleBtn) mobileToggleBtn.addEventListener("click", openMobileSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeMobileSidebar);

  // --- Persona Switcher Handler ---
  personaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      personaTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentPersonaMode = tab.getAttribute("data-mode") || "student";
      if (activeModeBadge) {
        activeModeBadge.textContent = PERSONA_LABELS[currentPersonaMode] || "🎓 Student Mode";
      }
    });
  });

  // --- Helper & Utility Functions ---
  const scrollToBottom = () => {
    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
  };

  const updateLocalStorageSessions = () => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  };

  const sanitizeAndParseMarkdown = (text) => {
    if (!text) return "";
    let rawHtml = window.marked ? window.marked.parse(text) : text;
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(rawHtml);
    }
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  };

  const getFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const attachCopyCodeButtons = (container) => {
    container.querySelectorAll("pre").forEach((preBlock) => {
      if (preBlock.querySelector(".copy-code-btn")) return;
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-code-btn";
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;

      copyBtn.addEventListener("click", () => {
        const codeText = preBlock.querySelector("code")?.innerText || preBlock.innerText;
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.querySelector("span").textContent = "Copied!";
          setTimeout(() => (copyBtn.querySelector("span").textContent = "Copy"), 2000);
        });
      });

      preBlock.appendChild(copyBtn);
    });
  };

  const createMessageElement = (message, type) => {
    const msgRow = document.createElement("div");
    msgRow.classList.add("message-row", type === "user" ? "user-row" : "bot-row");

    const avatar = document.createElement("div");
    avatar.className = `avatar-badge ${type === "user" ? "user-badge" : "bot-badge"}`;
    if (type === "user") {
      avatar.textContent = "U";
    } else {
      avatar.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
      `;
    }

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content", type === "user" ? "user-msg" : "bot-msg");
    contentDiv.setAttribute("data-message-type", type);

    if (type === "bot") {
      contentDiv.innerHTML = sanitizeAndParseMarkdown(message);
      attachCopyCodeButtons(contentDiv);

      // Action bar (Copy, Like, Dislike)
      const actionRow = document.createElement("div");
      actionRow.className = "msg-action-bar";

      const copyMsgBtn = document.createElement("button");
      copyMsgBtn.className = "msg-action-btn";
      copyMsgBtn.innerHTML = `📋 <span>Copy</span>`;
      copyMsgBtn.onclick = () => {
        navigator.clipboard.writeText(message).then(() => {
          copyMsgBtn.querySelector("span").textContent = "Copied!";
          setTimeout(() => (copyMsgBtn.querySelector("span").textContent = "Copy"), 2000);
        });
      };

      const likeBtn = document.createElement("button");
      likeBtn.className = "msg-action-btn";
      likeBtn.innerHTML = `👍`;
      likeBtn.onclick = () => (likeBtn.style.color = "var(--color-primary)");

      const dislikeBtn = document.createElement("button");
      dislikeBtn.className = "msg-action-btn";
      dislikeBtn.innerHTML = `👎`;
      dislikeBtn.onclick = () => (dislikeBtn.style.color = "var(--color-danger)");

      const timeLabel = document.createElement("span");
      timeLabel.style.marginLeft = "auto";
      timeLabel.style.fontSize = "11px";
      timeLabel.style.color = "var(--color-text-muted)";
      timeLabel.textContent = getFormattedTime();

      actionRow.appendChild(copyMsgBtn);
      actionRow.appendChild(likeBtn);
      actionRow.appendChild(dislikeBtn);
      actionRow.appendChild(timeLabel);
      contentDiv.appendChild(actionRow);
    } else {
      contentDiv.textContent = message;
      const statusLabel = document.createElement("div");
      statusLabel.className = "message-time-status";
      statusLabel.textContent = `${getFormattedTime()} ✓`;
      contentDiv.appendChild(statusLabel);
    }

    msgRow.appendChild(avatar);
    msgRow.appendChild(contentDiv);
    return msgRow;
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
    const loadingRow = document.createElement("div");
    loadingRow.className = "message-row bot-row";
    loadingRow.id = "activeLoadingIndicator";

    loadingRow.innerHTML = `
      <div class="avatar-badge bot-badge">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
      </div>
      <div class="message-content bot-msg loading-dots">
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
      </div>
    `;

    chatWindow.appendChild(loadingRow);
    scrollToBottom();

    if (sendBtn) sendBtn.style.display = "none";
    if (stopBtn) stopBtn.style.display = "flex";
  };

  const removeLoadingIndicator = () => {
    const loadingRow = document.getElementById("activeLoadingIndicator");
    if (loadingRow) loadingRow.remove();

    if (sendBtn) sendBtn.style.display = "flex";
    if (stopBtn) stopBtn.style.display = "none";
  };

  const getApiEndpoint = () => {
    if (window.API_BASE_URL) {
      return window.API_BASE_URL.endsWith('/chat') ? window.API_BASE_URL : `${window.API_BASE_URL.replace(/\/$/, '')}/chat`;
    }
    const savedApiBase = localStorage.getItem("API_BASE_URL");
    if (savedApiBase) {
      return savedApiBase.endsWith('/chat') ? savedApiBase : `${savedApiBase.replace(/\/$/, '')}/chat`;
    }
    if (window.location.protocol.startsWith("http")) {
      return `${window.location.origin}/chat`;
    }
    return "/chat";
  };

  const fetchChatResponse = async (prompt) => {
    activeAbortController = new AbortController();
    try {
      showLoadingIndicator();
      const response = await fetch(getApiEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: activeAbortController.signal,
        body: JSON.stringify({
          prompt,
          mode: currentPersonaMode,
          customSystemPrompt: customSystemPromptInput?.value.trim() || undefined,
        }),
      });
      removeLoadingIndicator();
      activeAbortController = null;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return errData.reply || `Server error (${response.status}). Please try again.`;
      }

      const data = await response.json();
      return data.reply || "No response received from server.";
    } catch (error) {
      removeLoadingIndicator();
      if (error.name === "AbortError") {
        return "🛑 Response generation stopped by user.";
      }
      console.error("Fetch error:", error);
      return "⚠️ Unable to connect to backend server. Please verify network or API configuration.";
    }
  };

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      if (activeAbortController) {
        activeAbortController.abort();
      }
    });
  }

  // --- Voice Input (Web Speech API) ---
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      if (voiceBtn) voiceBtn.classList.add("recording");
      if (voiceStatusToast) voiceStatusToast.style.display = "flex";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (userInput && transcript) {
        userInput.value = transcript;
        sendMessage();
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech Recognition Notice:", event.error);
      isListening = false;
      if (voiceBtn) voiceBtn.classList.remove("recording");
      if (voiceStatusToast) voiceStatusToast.style.display = "none";

      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (event.error === "no-speech") {
        // Silent timeout
      } else {
        alert(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isListening = false;
      if (voiceBtn) voiceBtn.classList.remove("recording");
      if (voiceStatusToast) voiceStatusToast.style.display = "none";
    };

    return recognition;
  };

  speechRecognition = initSpeechRecognition();

  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      if (!speechRecognition) {
        alert("Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice input.");
        return;
      }

      if (isListening) {
        speechRecognition.stop();
      } else {
        try {
          speechRecognition.start();
        } catch (err) {
          console.warn("Speech start exception:", err.message);
        }
      }
    });
  }

  // --- File & PDF & OCR Processing ---
  if (fileUploadBtn && fileInput) {
    fileUploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      attachedFileName = file.name;
      const extension = file.name.split(".").pop().toLowerCase();

      showLoadingIndicator();

      if (["png", "jpg", "jpeg"].includes(extension)) {
        try {
          if (window.Tesseract) {
            const result = await window.Tesseract.recognize(file, "eng");
            attachedFileContent = result.data.text;
            renderFilePreview(attachedFileName, "Image OCR");
          } else {
            alert("Tesseract OCR library failed to load.");
          }
        } catch (err) {
          console.error("OCR Error:", err);
          alert("Could not process image text.");
        }
      } else if (extension === "pdf") {
        try {
          if (window.pdfjsLib) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let extractedText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              extractedText += textContent.items.map((item) => item.str).join(" ") + "\n";
            }
            attachedFileContent = extractedText;
            renderFilePreview(attachedFileName, `PDF (${pdf.numPages} pgs)`);
          } else {
            alert("PDF.js library failed to load.");
          }
        } catch (err) {
          console.error("PDF Error:", err);
          alert("Could not extract PDF text.");
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          attachedFileContent = event.target.result;
          renderFilePreview(attachedFileName, "Document");
        };
        reader.readAsText(file);
      }

      removeLoadingIndicator();
    });
  }

  const renderFilePreview = (fileName, label) => {
    if (!filePreviewContainer) return;
    filePreviewContainer.style.display = "flex";
    filePreviewContainer.innerHTML = `
      <div class="file-badge">
        <span>📎 <strong>${fileName}</strong> (${label})</span>
        <button class="file-badge-remove" id="removeFileBtn">✕</button>
      </div>
    `;
    document.getElementById("removeFileBtn")?.addEventListener("click", clearAttachedFile);
  };

  const clearAttachedFile = () => {
    attachedFileContent = null;
    attachedFileName = null;
    if (fileInput) fileInput.value = "";
    if (filePreviewContainer) {
      filePreviewContainer.innerHTML = "";
      filePreviewContainer.style.display = "none";
    }
  };

  // --- Real-time Conversation Search ---
  if (searchChatsInput) {
    searchChatsInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const chatItems = chatList.querySelectorAll(".session-btn-container");

      chatItems.forEach((item) => {
        const title = item.querySelector(".session-btn")?.textContent.toLowerCase() || "";
        if (title.includes(query)) {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // --- Export Chat Session ---
  if (exportChatBtn) {
    exportChatBtn.addEventListener("click", () => {
      const currentSession = sessions[currentSessionId];
      if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
        alert("No chat messages to export.");
        return;
      }

      let markdown = `# ${currentSession.name || "EduPilot AI Chat"}\n\n`;
      markdown += `*Exported on ${new Date().toLocaleString()} — EduPilot AI*\n\n---\n\n`;

      currentSession.messages.forEach((msg) => {
        markdown += `### ${msg.type === "user" ? "👤 User" : "🤖 EduPilot AI"}\n${msg.text}\n\n`;
      });

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(currentSession.name || "chat").replace(/[^a-z0-9]/gi, "_")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // --- Prompt Template Modal ---
  const renderTemplates = (category) => {
    const templates = PROMPT_TEMPLATES[category] || [];
    templateGrid.innerHTML = templates
      .map(
        (t) => `
      <div class="template-item" data-prompt="${t.prompt.replace(/"/g, '&quot;')}">
        <div class="template-item-title">${t.title}</div>
        <div class="template-item-prompt">${t.prompt}</div>
      </div>
    `
      )
      .join("");

    templateGrid.querySelectorAll(".template-item").forEach((item) => {
      item.addEventListener("click", () => {
        const promptText = item.getAttribute("data-prompt");
        if (promptText) {
          userInput.value = promptText;
          templatesModal.classList.remove("show");
          userInput.focus();
        }
      });
    });
  };

  if (navTemplatesBtn) {
    navTemplatesBtn.addEventListener("click", () => {
      templatesModal.classList.add("show");
      renderTemplates("student");
    });
  }
  if (closeTemplatesBtn) {
    closeTemplatesBtn.addEventListener("click", () => templatesModal.classList.remove("show"));
  }
  templateTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      templateTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderTemplates(tab.getAttribute("data-cat"));
    });
  });

  // --- Settings Modal & Navigation ---
  if (navSettingsBtn) navSettingsBtn.addEventListener("click", () => settingsModal.classList.add("show"));
  if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener("change", (e) => {
      if (e.target.value === "large") {
        document.body.classList.add("large-font");
      } else {
        document.body.classList.remove("large-font");
      }
    });
  }

  if (clearAllChatsBtn) {
    clearAllChatsBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete ALL chat history?")) {
        sessions = {};
        updateLocalStorageSessions();
        startNewChat();
        settingsModal.classList.remove("show");
      }
    });
  }

  // --- Shortcut Cards Click Handler ---
  shortcutCards.forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.getAttribute("data-action");
      if (action) handleAction(action);
    });
  });

  // --- Session Management & Sidebar ---
  const getSessionTitle = (session) => {
    if (session.name && session.name !== "New Chat" && session.name !== "Untitled Chat") {
      return session.name;
    }
    const firstUserMsg = session.messages ? session.messages.find((msg) => msg.type === "user") : null;
    return firstUserMsg ? firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? "..." : "") : "Untitled Chat";
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

    btnContainer.onclick = () => {
      loadSession(sessionId);
      closeMobileSidebar();
    };

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const createActionButton = (text, onClick, title) => {
      const actionBtn = document.createElement("button");
      actionBtn.textContent = text;
      actionBtn.title = title;
      actionBtn.onclick = onClick;
      return actionBtn;
    };

    const renameBtn = createActionButton(
      "✎",
      (e) => {
        e.stopPropagation();
        renameSession(sessionId);
      },
      "Rename chat"
    );
    renameBtn.className = "rename-btn";

    const deleteBtn = createActionButton(
      "✖",
      (e) => {
        e.stopPropagation();
        deleteSession(sessionId);
      },
      "Delete chat"
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

    if (previousChatsContainer) {
      previousChatsContainer.style.display = Object.keys(sessions).length > 0 ? "block" : "none";
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
    if (sessions[sessionId] && sessions[sessionId].messages && sessions[sessionId].messages.length > 0) {
      sessions[sessionId].messages.forEach(({ text, type }) => displayMessage(text, type, false));
    }
    loadPreviousChats();
  };

  const showEmptyState = () => {
    chatWindow.innerHTML = `
      <div class="chat-empty-state">
        <div class="empty-state-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-muted)">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h2 class="empty-state-title">How can I help you today?</h2>
        <p class="empty-state-subtitle">Ask a question, upload a PDF or image, use a prompt template, or try voice input.</p>
      </div>
    `;
  };

  const startNewChat = () => {
    pruneEmptySessions();
    currentSessionId = Date.now().toString();
    chatWindow.innerHTML = "";
    showEmptyState();
    sessions[currentSessionId] = { messages: [], name: "New Chat" };
    loadPreviousChats();
    clearAttachedFile();
    closeMobileSidebar();
  };

  // --- User Interaction Handlers ---
  const sendMessage = async () => {
    let input = userInput.value.trim();
    if (!input && !attachedFileContent) return;

    if (attachedFileContent) {
      input = `[Attached File: ${attachedFileName}]\n\n${attachedFileContent}\n\nUser Question: ${input || "Summarize this document and highlight key points."}`;
      clearAttachedFile();
    }

    displayMessage(input, "user");
    userInput.value = "";

    const botReply = await fetchChatResponse(input);
    displayMessage(botReply, "bot");
    loadPreviousChats();
  };

  const handleAction = async (action) => {
    const inputText = userInput.value.trim();
    let promptText = "";

    switch (action) {
      case "Generate Questions":
        promptText = `Generate 5 quiz questions on: ${inputText || "Photosynthesis and Cell Respiration"}`;
        break;
      case "Explain":
        promptText = `Explain this concept in simple terms: ${inputText || "Quantum computing and qubits"}`;
        break;
      case "Code Explanation":
        promptText = `Explain this code line-by-line: ${inputText || "def binary_search(arr, target):"}`;
        break;
      case "Summarize":
        promptText = `Summarize key points of: ${inputText || "The Industrial Revolution"}`;
        break;
      default:
        promptText = inputText;
    }

    if (attachedFileContent) {
      promptText = `[Attached File: ${attachedFileName}]\n\n${attachedFileContent}\n\n${promptText}`;
      clearAttachedFile();
    }

    displayMessage(promptText, "user");
    userInput.value = "";

    const botReply = await fetchChatResponse(promptText);
    displayMessage(botReply, "bot");
    loadPreviousChats();
  };

  // Event Listeners
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);
  if (navChatBtn) navChatBtn.addEventListener("click", startNewChat);
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  // Initialization
  if (Object.keys(sessions).length > 0) {
    const latestSessionId = Object.keys(sessions).sort((a, b) => parseInt(b) - parseInt(a))[0];
    loadSession(latestSessionId);
  } else {
    startNewChat();
  }
});