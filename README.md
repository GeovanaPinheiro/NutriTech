NutriTech 🚀

Landing page moderna, responsiva e de alto padrão desenvolvida para o ecossistema NutriTech & Nutrilab, unindo suplementos premium, snacks saudáveis, vestuário de performance e um assistente virtual inteligente integrado com IA.

✨ Funcionalidades Principais

Visual Exclusivo e Responsivo (Dark/Light Mode): Interface otimizada para computadores, tablets e dispositivos móveis com transição de tema fluida.

Catálogo Organizado: Seções dedicadas a essenciais da coleção, snacks e vestuário de performance com preços e cartões interativos.

Assistente Virtual (Max): Chatbot flutuante inteligente alimentado pela API do Google Gemini para tirar dúvidas de navegação, produtos e orientar clientes.

Geolocalização Dinâmica: Botão interativo para identificar a região do visitante em tempo real.

Experiência Otimizada: Imagens organizadas na pasta de assets images/ com carregamento rápido e design voltado para conversão.

📂 Estrutura do Projeto

O repositório está organizado da seguinte forma:

NutriTech/
│
├── index.html          # Página principal da landing page
├── style.css           # Estilos visuais completos (com suporte a dark/light mode)
├── script.js           # Lógica de interações (tema, menu mobile, geolocalização, formulário)
├── chatbot.js          # Lógica de funcionamento e contexto do assistente virtual Max
├── chatbot.css         # Estilos isolados do chatbot
├── config.js           # Chave de configuração da API do Gemini
├── .gitignore          # Arquivos ignorados pelo controle de versão
└── images/             # Pasta contendo todas as imagens e assets do projeto
    ├── logo.img (2).jpeg
    ├── wheyprotein.img.jpeg
    ├── creatina.img.jpeg
    ├── preworkout.img.jpeg
    ├── multivitaminico.img.jpeg
    ├── BotMax.img.jpeg
    ├── Nutritechlab.img.jpeg
    ├── barra de cereal banana com canela.img.jpg
    ├── barra de cereal chocolate com amendoim.img.jpg
    ├── Barra de cereal morango e chocolate branco.img.jpg
    ├── bebida lactea morango.img.jpg
    ├── bebida lactea baunilha.img.jpg
    ├── bebida lactea chocolate.img.jpg
    ├── camisa de academia.img.jpg
    ├── calça de academia.img.jpg
    └── top feminino.img.jpg


🛠️ Tecnologias Utilizadas

HTML5 Semantic — Estrutura da aplicação web

CSS3 Moderno — Flexbox, Grid, Variáveis CSS e animações personalizadas

JavaScript (Vanilla) — Dinamismo e interações da interface

Google Gemini API — Inteligência artificial por trás do assistente virtual Max

⚙️ Como Executar o Projeto

Como se trata de uma aplicação web estática, podes abrir o projeto de forma muito simples:

Diretamente no navegador: Clica duas vezes no ficheiro index.html.

Via Servidor Local (Recomendado para testar o chatbot e scripts):
Abre o terminal na pasta do projeto e executa o servidor local:

python -m http.server 8000


Em seguida, abre no teu navegador:

http://localhost:8000


🔑 Configuração do Chatbot (Max)

Para que o assistente virtual responda às perguntas dos visitantes utilizando a inteligência artificial do Gemini, insere a tua chave de API no arquivo config.js:

const GEMINI_API_KEY = "SUA_CHAVE_AQUI";


📄 Licença

Desenvolvido por Geovana Pinheiro e Mateus Sampaio para o projeto NutriTech. Todos os direitos reservados.
