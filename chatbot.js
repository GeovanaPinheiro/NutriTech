document.addEventListener("DOMContentLoaded", () => {
  const toggleButton =
    document.getElementById("chatbot-toggle") ||
    document.getElementById("chat-toggle") ||
    document.getElementById("open-chat") ||
    document.querySelector("[data-chat-toggle]") ||
    document.querySelector(".chatbot-toggle") ||
    document.querySelector(".chat-toggle") ||
    document.querySelector(".chat-fab");

  const chatWindow =
    document.getElementById("chatbot-window") ||
    document.getElementById("chat-window") ||
    document.getElementById("chatbot-box") ||
    document.getElementById("chat-box") ||
    document.querySelector("[data-chat-window]") ||
    document.querySelector(".chatbot-window") ||
    document.querySelector(".chat-window") ||
    document.querySelector(".chatbot-container") ||
    document.querySelector(".chat-container");

  const closeButton =
    document.getElementById("chatbot-close") ||
    document.getElementById("chat-close") ||
    document.querySelector("[data-chat-close]") ||
    (chatWindow
      ? chatWindow.querySelector(
          ".chatbot-close, .chat-close, .close-chat, [aria-label*='fechar' i], [aria-label*='close' i]"
        )
      : null);

  const form =
    (chatWindow && chatWindow.querySelector("form")) ||
    document.getElementById("chatbot-form") ||
    document.getElementById("chat-form") ||
    document.querySelector("[data-chat-form]") ||
    document.querySelector(".chatbot-form") ||
    document.querySelector(".chat-form");

  const input =
    (form && form.querySelector("input, textarea")) ||
    (chatWindow && chatWindow.querySelector("input, textarea")) ||
    document.getElementById("chatbot-input") ||
    document.getElementById("chat-input") ||
    document.querySelector("[data-chat-input]") ||
    document.querySelector(".chatbot-input") ||
    document.querySelector(".chat-input");

  const messagesContainer =
    (chatWindow &&
      chatWindow.querySelector(
        "#chat-messages, #chatbot-messages, .chat-messages, .chatbot-messages, [data-chat-messages]"
      )) ||
    document.getElementById("chat-messages") ||
    document.getElementById("chatbot-messages") ||
    document.querySelector(".chat-messages") ||
    document.querySelector(".chatbot-messages");

  const sendButton =
    (form && form.querySelector('button[type="submit"], button')) ||
    (chatWindow && chatWindow.querySelector("#chat-send, #chatbot-send, .chat-send, .chatbot-send")) ||
    document.getElementById("chat-send") ||
    document.getElementById("chatbot-send");

  function setChatOpen(isOpen) {
    if (!chatWindow) return;

    chatWindow.classList.toggle("open", isOpen);
    chatWindow.classList.toggle("active", isOpen);
    chatWindow.classList.toggle("show", isOpen);
    chatWindow.classList.toggle("hidden", !isOpen);

    if (isOpen) {
      chatWindow.style.display = "flex";
      chatWindow.setAttribute("aria-hidden", "false");
      if (input) {
        setTimeout(() => input.focus(), 50);
      }
    } else {
      chatWindow.style.display = "none";
      chatWindow.setAttribute("aria-hidden", "true");
    }

    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", String(isOpen));
    }
  }

  function isChatCurrentlyOpen() {
    if (!chatWindow) return false;
    const computedDisplay = window.getComputedStyle(chatWindow).display;
    return (
      chatWindow.classList.contains("open") ||
      chatWindow.classList.contains("active") ||
      chatWindow.classList.contains("show") ||
      (computedDisplay !== "none" && !chatWindow.classList.contains("hidden"))
    );
  }

  if (toggleButton && chatWindow) {
    // Se a janela já vier aberta ou fechada no CSS, respeita ou garante fechada inicialmente se oculta
    if (window.getComputedStyle(chatWindow).display === "none") {
      setChatOpen(false);
    }

    toggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setChatOpen(!isChatCurrentlyOpen());
    });
  }

  if (closeButton && chatWindow) {
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setChatOpen(false);
    });
  }

  function appendMessage(text, sender = "bot") {
    if (!messagesContainer) return null;

    const msgEl = document.createElement("div");
    msgEl.className =
      sender === "user"
        ? "chat-message chat-message--user user-message"
        : "chat-message chat-message--bot bot-message";
    msgEl.textContent = text;
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgEl;
  }

  async function sendToGemini(mensagem) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mensagem }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (!response.ok || data.sucesso === false) {
      console.error("Falha em /api/chat:", data);
      throw new Error(
        data.error || `O servidor respondeu com erro HTTP ${response.status}.`
      );
    }

    return data.resposta || data.reply || data.text || "Sem resposta no momento.";
  }

  async function handleSend(event) {
    if (event) event.preventDefault();
    if (!input) return;

    const textoDigitado = (input.value || "").trim();
    if (!textoDigitado) {
      input.focus();
      return;
    }

    appendMessage(textoDigitado, "user");
    input.value = "";
    input.focus();

    const loadingEl = appendMessage("Pensando...", "bot");

    if (sendButton) sendButton.disabled = true;
    input.disabled = true;

    try {
      const respostaBot = await sendToGemini(textoDigitado);
      if (loadingEl) {
        loadingEl.textContent = respostaBot;
      } else {
        appendMessage(respostaBot, "bot");
      }
    } catch (err) {
      console.error("Erro do chatbot:", err);
      const msgErro =
        "Não consegui responder agora. Tente novamente em instantes.";
      if (loadingEl) {
        loadingEl.textContent = msgErro;
      } else {
        appendMessage(msgErro, "bot");
      }
    } finally {
      if (sendButton) sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  if (form) {
    form.addEventListener("submit", handleSend);
  }

  if (sendButton && (!form || !form.contains(sendButton) || sendButton.type !== "submit")) {
    sendButton.addEventListener("click", handleSend);
  }

  if (input && !form) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend(event);
      }
    });
  }
});document.addEventListener("DOMContentLoaded", () => {
  const form =
    document.getElementById("chat-form") ||
    document.querySelector("[data-chat-form]") ||
    document.querySelector(".chat-form");

  const input =
    document.getElementById("chat-input") ||
    document.querySelector("[data-chat-input]") ||
    document.querySelector(".chat-input") ||
    (form ? form.querySelector("input, textarea") : null);

  const messagesContainer =
    document.getElementById("chat-messages") ||
    document.querySelector("[data-chat-messages]") ||
    document.querySelector(".chat-messages");

  const sendButton =
    document.getElementById("chat-send") ||
    (form ? form.querySelector('button[type="submit"], button') : null);

  if (!form || !input || !messagesContainer) {
    console.warn("Elementos do chatbot não encontrados no DOM. Confira os IDs/classes no index.html.");
    return;
  }

  function appendMessage(text, sender = "bot") {
    const msgEl = document.createElement("div");
    msgEl.classList.add("chat-message", `chat-message--${sender}`);
    msgEl.textContent = text;
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgEl;
  }

  async function sendToGemini(mensagem) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mensagem }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (!response.ok || data.sucesso === false) {
      console.error("Falha em /api/chat:", data);
      throw new Error(
        data.error || `O servidor respondeu com erro HTTP ${response.status}.`
      );
    }

    return data.resposta || data.reply || data.text || "Sem resposta no momento.";
  }

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const textoDigitado = (input.value || "").trim();
    if (!textoDigitado) {
      input.focus();
      return;
    }

    appendMessage(textoDigitado, "user");
    input.value = "";
    input.focus();

    const loadingEl = appendMessage("Pensando...", "bot");

    if (sendButton) sendButton.disabled = true;
    input.disabled = true;

    try {
      const respostaBot = await sendToGemini(textoDigitado);
      loadingEl.textContent = respostaBot;
    } catch (err) {
      console.error("Erro do chatbot:", err);
      loadingEl.textContent =
        "Não consegui responder agora. Tente novamente em instantes.";
    } finally {
      if (sendButton) sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", handleSubmit);

  if (sendButton && sendButton.type !== "submit") {
    sendButton.addEventListener("click", handleSubmit);
  }
});
