const GEMINI_MODEL = "gemini-3.5-flash-lite";


const getProductFacts = () => {
    const cards = [...document.querySelectorAll('.card')];
    const products = cards
        .map((card) => {
            const name = card.querySelector('h3')?.textContent?.trim();
            const description = card.querySelector('p')?.textContent?.trim();
            const price = card.querySelector('.price')?.textContent?.trim();

            if (!name) return null;
            return {
                nome: name,
                descricao: description || '[PREENCHER]',
                preco: price || '[PREENCHER]'
            };
        })
        .filter(Boolean);

    const aboutText = document.querySelector('#sobre .sobre-content')?.innerText?.replace(/\s+/g, ' ').trim() || '[PREENCHER]';
    const contactTitle = document.querySelector('#contato .section-title')?.textContent?.trim() || 'Contato';
    const locationText = document.getElementById('locationBtn')?.textContent?.trim() || '[PREENCHER]';
    const navigationText = [...document.querySelectorAll('.nav-links a, .location-btn')]
        .map((link) => link.textContent?.trim())
        .filter(Boolean)
        .join(', ');

    return {
        marca: 'NutriTech',
        laboratorio: 'Nutrilab',
        sobre: aboutText,
        contato: `Seção de contato: ${contactTitle}. E-mails, WhatsApp e endereço físico ainda precisam ser preenchidos no projeto: [PREENCHER].`,
        localizacao: `Botão de localização do site: ${locationText}. Endereço físico real da loja: [PREENCHER].`,
        navegacao: navigationText,
        produtos: products
    };
};

const buildSystemPrompt = () => {
    const facts = getProductFacts();

    return `
Você é o Nutri, assistente virtual oficial da NutriTech.

Personalidade:
- Simpática, motivadora, objetiva e acessível.
- Responda em português do Brasil.
- Máximo de 4 frases por resposta.
- Use emojis leves, sem exagerar.

Papel:
- Tirar dúvidas sobre os produtos, marca e navegação do site.
- Explicar como navegar em Início, Snacks, Performance, A Marca, Produtos, Contato e Localização.
- Apoiar o visitante de forma prática e amigável.
- Melhorar a navegação e a experiência de compra.

Contexto da loja:
- Marca: ${facts.marca}
- Laboratório / origem da marca: ${facts.laboratorio}
- Sobre a marca: ${facts.sobre}
- Navegação do site: ${facts.navegacao}
- Contato: ${facts.contato}
- Localização: ${facts.localizacao}
- Produtos reais do site:
${facts.produtos.map((produto) => `• ${produto.nome} — ${produto.descricao} — ${produto.preco}`).join('\n')}

Regras de comportamento:
- Responda SOMENTE sobre a NutriTech, seus produtos e o uso do site.
- Se o assunto fugir disso, recuse educadamente e redirecione para o que você pode ajudar.
- Não dê diagnóstico médico nem prescreva dietas, doses ou planos terapêuticos.
- Em casos de saúde, recomende procurar um nutricionista ou médico.
- Não invente informações sobre a loja, produtos ou atendimento.
- Se não souber algo, diga que pode orientar pelo contato da loja ou pela página de Contato e peça que o visitante entre em contato.
- Se o visitante pedir busca por produto, sugira os itens disponíveis reais do site.

Importante: se houver alguma informação faltando no front-end atual, mantenha esse campo como [PREENCHER] e informe ao usuário que ele precisa completar no projeto.
`.trim();
};

const history = [];
let isTyping = false;
let welcomeShown = false;

const getChatElements = () => ({
    chat: document.getElementById('chatbot'),
    openButton: document.getElementById('openChat'),
    closeButton: document.getElementById('closeChat'),
    messages: document.getElementById('chatMessages'),
    input: document.getElementById('chatInput'),
    sendButton: document.getElementById('sendChat')
});

const appendMessage = (sender, text) => {
    const { messages } = getChatElements();
    const messageBox = document.createElement('div');
    messageBox.className = `message ${sender}`;
    messageBox.textContent = text;
    messages.appendChild(messageBox);
    messages.scrollTop = messages.scrollHeight;
};

const setTypingState = (typing) => {
    const { input, sendButton, messages } = getChatElements();
    isTyping = typing;

    if (input) input.disabled = typing;
    if (sendButton) sendButton.disabled = typing;

    const existingTyping = messages?.querySelector('.message.typing');
    if (typing) {
        if (!existingTyping) {
            const typingBox = document.createElement('div');
            typingBox.className = 'message bot typing';
            typingBox.textContent = 'Digitando';
            messages.appendChild(typingBox);
            messages.scrollTop = messages.scrollHeight;
        }
    } else if (existingTyping) {
        existingTyping.remove();
    }
};

const showWelcome = () => {
    if (welcomeShown) return;
    appendMessage('bot', 'Olá! Sou o Nutri, seu assistente da NutriTech. Posso te ajudar a encontrar suplementos, snacks e produtos para performance no site.');
    welcomeShown = true;
};

const toggleChat = (isOpen) => {
    const { chat, openButton } = getChatElements();
    if (!chat || !openButton) return;

    chat.classList.toggle('active', isOpen);
    openButton.style.display = isOpen ? 'none' : 'flex';

    if (isOpen && !welcomeShown) {
        showWelcome();
    }
};

const removeLastUserMessageFromHistory = () => {
    if (history.length && history[history.length - 1].role === 'user') {
        history.pop();
    }
};

const sendToGemini = async () => {
    const { input, sendButton } = getChatElements();
    const text = input?.value.trim();

    if (!text || isTyping || !GEMINI_API_KEY || GEMINI_API_KEY === 'COLE_SUA_CHAVE_AQUI') {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'COLE_SUA_CHAVE_AQUI') {
            appendMessage('bot', 'Ainda não configurei a chave da API do Gemini. Coloque sua chave em config.js e recarregue a página.');
        }
        return;
    }

    appendMessage('user', text);
    history.push({ role: 'user', parts: [{ text }] });
    input.value = '';
    setTypingState(true);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: buildSystemPrompt() }]
                },
                contents: history,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui montar uma resposta agora. Tente novamente em instantes.';
        history.push({ role: 'model', parts: [{ text: botReply }] });
        appendMessage('bot', botReply.trim());
    } catch (error) {
        console.error('Erro do chatbot:', error);
        appendMessage('bot', 'Não consegui responder no momento. Tente novamente em instantes ou use o contato da loja para falar com o atendimento.');
        removeLastUserMessageFromHistory();
    } finally {
        setTypingState(false);
        if (sendButton) sendButton.disabled = false;
    }
};

const bindChatEvents = () => {
    const { openButton, closeButton, input, sendButton } = getChatElements();

    if (openButton) {
        openButton.addEventListener('click', () => toggleChat(true));
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => toggleChat(false));
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendToGemini);
    }

    if (input) {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendToGemini();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    bindChatEvents();
    const { chat, openButton } = getChatElements();

    if (chat) {
        chat.setAttribute('aria-live', 'polite');
    }

    if (openButton) {
        openButton.style.display = 'flex';
    }
});
