# NutriTech

## Descrição do projeto

Landing page moderna da NutriTech com visual premium, responsivo e foco em conversão. O projeto apresenta catálogo de suplementos, seção sobre a marca, contato e chatbot para auxiliar clientes com dúvidas de navegação e produtos.

## Stack tecnológica

- HTML5
- CSS3
- JavaScript Vanilla
- API do Google Gemini para o assistente virtual

## Estrutura do projeto

- `index.html` — estrutura da página principal
- `style.css` — estilos visuais do site
- `script.js` — interações da interface (tema, menu, geolocalização, formulário)
- `chatbot.js` — lógica do chatbot
- `chatbot.css` — estilos do chat
- `config.js` — arquivo de configuração da API do Gemini
- `api/chat.js` — endpoint de integração do chatbot
- `images/` — imagens e assets do projeto

## Como executar

Como o projeto é uma aplicação estática, basta abrir o arquivo `index.html` em um navegador.

Se preferir rodar via servidor local:

```bash
cd "C:\Users\Pinhe\OneDrive\Documentos\NutriTech Project"
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Configuração do chatbot

Antes de usar o chatbot, configure sua chave da API do Gemini no arquivo `config.js`.

```js
const GEMINI_API_KEY = "SUA_CHAVE_AQUI";
```

## Funcionalidades principais

- Landing page premium para marca de suplementos
- Catálogo com produtos e preços
- Navegação por seções da loja
- Experiência mobile-first
- Chatbot com respostas em português
- Design visual alinhado ao mercado fitness

## Observações

Este projeto foi desenvolvido como uma página comercial estática com foco em apresentação e conversão, podendo ser expandido com back-end, admin de produtos, autenticação e integração com checkout real.
