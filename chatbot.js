document.addEventListener("DOMContentLoaded", () => {
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
