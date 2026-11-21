# NUTRITECH — Projeto de Banco de Dados

## 1. Sobre o projeto

Este projeto consiste no desenvolvimento de um sistema de gerenciamento de estoque para a NutriTech, com foco na utilização de banco de dados relacionais.

A aplicação permite cadastrar, consultar, atualizar e excluir produtos, mantendo suas informações e quantidades armazenadas em um banco de dados PostgreSQL.

## 2. Objetivo

Desenvolver uma solução para organizar e gerenciar os dados dos produtos e do estoque, aplicando conceitos de banco de dados relacionais e operações CRUD.

## 3. Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| Python | Desenvolvimento do backend |
| Flask | Comunicação entre a aplicação e o banco de dados |
| PostgreSQL | Sistema gerenciador de banco de dados |
| Neon | Hospedagem do banco de dados em nuvem |
| psycopg | Conexão entre Python e PostgreSQL |
| HTML, CSS e JavaScript | Interface do sistema |

## 4. Estrutura do banco de dados

O banco de dados possui duas tabelas principais:

### Tabela `produtos`

Responsável por armazenar as informações dos produtos cadastrados.

| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL | Chave primária |
| nome | VARCHAR(150) | Nome do produto |
| categoria | VARCHAR(100) | Categoria do produto |
| descricao | TEXT | Descrição do produto |
| preco | NUMERIC(10,2) | Preço do produto |

### Tabela `estoque`

Responsável por armazenar as quantidades disponíveis de cada produto.

| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL | Chave primária |
| produto_id | INTEGER | Chave estrangeira relacionada à tabela produtos |
| quantidade | INTEGER | Quantidade disponível |
| ultima_atualizacao | TIMESTAMP | Data e hora da última atualização |

## 5. Relacionamento entre as tabelas

A tabela `produtos` possui um relacionamento de um para um (1:1) com a tabela `estoque`.

Cada registro de estoque está associado a um produto por meio do campo `produto_id`, que funciona como chave estrangeira e possui restrição de unicidade.

## 6. Operações CRUD

O sistema implementa as quatro operações fundamentais de manipulação de dados:

| Operação | Funcionalidade |
|---|---|
| CREATE | Cadastrar novos produtos e suas quantidades |
| READ | Consultar produtos e informações do estoque |
| UPDATE | Atualizar dados dos produtos e quantidades |
| DELETE | Excluir produtos e seus registros de estoque |

## 7. Organização dos arquivos

```text
NutriTech/
├── app.py
├── init_db.py
├── cadastrar_produtos.py
├── requirements.txt
├── .env
├── templates/
│   └── estoque.html
└── README_BANCO_DE_DADOS.md
```

## 8. Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/GeovanaPinheiro/NutriTech.git
```

### 2. Entrar na pasta do projeto

```bash
cd NutriTech
```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar o banco de dados

Criar um arquivo `.env` na raiz do projeto e adicionar a variável `DATABASE_URL` com a URL de conexão do banco PostgreSQL.

### 5. Executar a aplicação

```bash
python app.py
```

### 6. Acessar o sistema

Abrir o navegador e acessar:

```text
http://127.0.0.1:5000/estoque
```

## 9. Equipe

**Participantes:**

- Matheus Castro Sampaio
- Geovana Pinheiro

---

**NUTRITECH — Projeto de Banco de Dados**
