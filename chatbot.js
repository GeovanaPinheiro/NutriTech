document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openChat");
  const closeBtn = document.getElementById("closeChat");
  const chatBox = document.getElementById("chatbot");
  const messagesEl = document.getElementById("chatMessages");
  const inputEl = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendChat");

  if (!openBtn || !chatBox || !messagesEl || !inputEl || !sendBtn) {
    console.error("Elementos do chatbot não encontrados no index.html.", {
      openBtn,
      chatBox,
      messagesEl,
      inputEl,
      sendBtn,
    });
    return;
  }

  // Garante estado inicial fechado até clicar no botão do Max
  chatBox.style.display = "none";

  function abrirChat() {
    chatBox.style.display = "flex";
    chatBox.style.flexDirection = "column";
    chatBox.classList.add("open", "active");
    openBtn.style.display = "none";
    setTimeout(() => inputEl.focus(), 50);
  }

  function fecharChat() {
    chatBox.style.display = "none";
    chatBox.classList.remove("open", "active");
    openBtn.style.display = "flex";
  }

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    abrirChat();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fecharChat();
    });
  }

  function adicionarMensagem(texto, remetente = "bot") {
    const item = document.createElement("div");
    item.className = `chat-msg chat-msg--${remetente}`;
    item.textContent = texto;
    item.style.padding = "8px 12px";
    item.style.margin = "6px 0";
    item.style.borderRadius = "10px";
    item.style.maxWidth = "85%";
    item.style.wordBreak = "break-word";

    if (remetente === "user") {
      item.style.alignSelf = "flex-end";
      item.style.background = "#0af0c6";
      item.style.color = "#06121a";
    } else {
      item.style.alignSelf = "flex-start";
      item.style.background = "#15242d";
      item.style.color = "#ffffff";
    }

    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return item;
  }

  // Mensagem inicial de boas-vindas do Max
  adicionarMensagem(
    "Olá! Sou o Max, seu assistente virtual da NutriTech. Qual é a sua dúvida?",
    "bot"
  );

  async function enviarParaBackend(mensagem) {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mensagem }),
    });

    let data = {};
    try {
      data = await resp.json();
    } catch (_) {
      data = {};
    }

    if (!resp.ok || data.sucesso === false) {
      console.error("Falha em /api/chat:", data);
      throw new Error(
        data.error || `O servidor respondeu com erro HTTP ${resp.status}.`
      );
    }

    return data.resposta || data.reply || data.text || "Sem resposta no momento.";
  }

  async function handleEnviar() {
    const texto = (inputEl.value || "").trim();
    if (!texto) {
      inputEl.focus();
      return;
    }

    adicionarMensagem(texto, "user");
    inputEl.value = "";
    inputEl.focus();

    const carregando = adicionarMensagem("Pensando...", "bot");

    sendBtn.disabled = true;
    inputEl.disabled = true;

    try {
      const resposta = await enviarParaBackend(texto);
      carregando.textContent = resposta;
    } catch (err) {
      console.error("Erro do chatbot:", err);
      carregando.textContent =
        "Não consegui responder agora. Tente novamente em instantes.";
    } finally {
      sendBtn.disabled = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleEnviar();
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  });
});
