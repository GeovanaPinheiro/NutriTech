
from flask import Flask, jsonify, render_template, request, send_from_directory
from dotenv import load_dotenv
import os
import psycopg
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

load_dotenv()

app = Flask(__name__)

@app.route("/api/chat", methods=["POST"])
def chat():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "text": "O assistente ainda não foi configurado. Defina GEMINI_API_KEY no arquivo .env."
        }), 503

    data = request.get_json(silent=True) or {}
    system_instruction = data.get("systemInstruction")
    contents = data.get("contents")

    if not isinstance(system_instruction, str) or not system_instruction.strip():
        return jsonify({"text": "Não foi possível preparar a conversa."}), 400

    if not isinstance(contents, list) or not contents:
        return jsonify({"text": "Digite sua pergunta para o Max."}), 400

    payload = json.dumps({
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800
        }
    }).encode("utf-8")
    gemini_request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        },
        method="POST"
    )

    try:
        with urlopen(gemini_request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        print(f"Erro da API Gemini ({error.code}): {error.read().decode('utf-8', errors='replace')}")
        return jsonify({
            "text": "Não consegui responder no momento. Tente novamente em instantes."
        }), 502
    except (URLError, TimeoutError) as error:
        print(f"Falha ao conectar com a API Gemini: {error}")
        return jsonify({
            "text": "Não consegui conectar ao assistente. Tente novamente em instantes."
        }), 502
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        print(f"Resposta inválida da API Gemini: {error}")
        return jsonify({
            "text": "O assistente retornou uma resposta inválida. Tente novamente."
        }), 502

    text = "".join(
        part.get("text", "")
        for candidate in result.get("candidates", [])
        for part in candidate.get("content", {}).get("parts", [])
        if isinstance(part, dict)
    ).strip()

    if not text:
        return jsonify({
            "text": "Não consegui montar uma resposta agora. Tente novamente em instantes."
        }), 502

    return jsonify({"text": text})

@app.route("/estoque")
def pagina_estoque():
    return render_template("estoque.html")

@app.route("/")
def inicio():
    return send_from_directory(app.root_path, "index.html")

@app.route("/<path:asset>")
def frontend_asset(asset):
    public_assets = {"style.css", "chatbot.css", "script.js", "chatbot.js"}
    if asset not in public_assets and not asset.startswith("images/"):
        return jsonify({"mensagem": "Arquivo não encontrado."}), 404

    return send_from_directory(app.root_path, asset)

@app.route("/api/status")
def status():
    return jsonify({
        "mensagem": "NutriTech Back End funcionando!",
        "status": "online"
    })

@app.route("/api/db-status")
def db_status():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return jsonify({"status": "erro", "mensagem": "DATABASE_URL não encontrada"}), 500

    try:
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT current_database()")
                nome_banco = cursor.fetchone()[0]

        return jsonify({
            "status": "conectado",
            "banco": nome_banco
        })

    except Exception as erro:
        print("Erro na conexão:", erro)
        return jsonify({
            "status": "erro",
            "mensagem": "Não foi possível conectar ao banco."
        }), 500


@app.route("/api/produtos")
def listar_produtos():
    try:
        with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        p.id,
                        p.nome,
                        p.categoria,
                        p.descricao,
                        p.preco,
                        COALESCE(e.quantidade, 0) AS estoque
                    FROM produtos p
                    LEFT JOIN estoque e ON p.id = e.produto_id
                    ORDER BY p.id
                """)

                produtos = cursor.fetchall()

        resultado = []

        for produto in produtos:
            resultado.append({
                "id": produto[0],
                "nome": produto[1],
                "categoria": produto[2],
                "descricao": produto[3],
                "preco": float(produto[4]),
                "estoque": produto[5]
            })

        return jsonify(resultado)

    except Exception as erro:
        print("Erro ao consultar produtos:", erro)
        return jsonify({
            "status": "erro",
            "mensagem": "Não foi possível consultar os produtos."
        }), 500


@app.route("/api/produtos/<int:produto_id>", methods=["PUT"])
def editar_produto(produto_id):
    dados = request.get_json()

    if not dados:
        return jsonify({"mensagem": "Dados não enviados."}), 400

    nome = dados.get("nome")
    categoria = dados.get("categoria")
    descricao = dados.get("descricao")
    preco = dados.get("preco")
    quantidade = dados.get("quantidade")

    if not nome or not categoria or preco is None or quantidade is None:
        return jsonify({"mensagem": "Preencha todos os campos obrigatórios."}), 400

    try:
        preco = float(preco)
        quantidade = int(quantidade)

        if preco < 0 or quantidade < 0:
            raise ValueError()

    except (ValueError, TypeError):
        return jsonify({"mensagem": "Preço ou quantidade inválidos."}), 400

    try:
        with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE produtos
                    SET nome = %s,
                        categoria = %s,
                        descricao = %s,
                        preco = %s
                    WHERE id = %s
                    RETURNING id
                """, (nome, categoria, descricao, preco, produto_id))

                resultado = cursor.fetchone()

                if not resultado:
                    return jsonify({"mensagem": "Produto não encontrado."}), 404

                cursor.execute("""
                    UPDATE estoque
                    SET quantidade = %s,
                        ultima_atualizacao = CURRENT_TIMESTAMP
                    WHERE produto_id = %s
                """, (quantidade, produto_id))

        return jsonify({"mensagem": "Produto atualizado com sucesso!"})

    except psycopg.errors.UniqueViolation:
        return jsonify({"mensagem": "Já existe um produto com esse nome."}), 409

    except Exception as erro:
        print("Erro ao editar produto:", erro)
        return jsonify({"mensagem": "Não foi possível atualizar o produto."}), 500
@app.route("/api/produtos/<int:produto_id>", methods=["DELETE"])
def excluir_produto(produto_id):
    try:
        with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
            with conn.cursor() as cursor:

                cursor.execute("""
                    DELETE FROM estoque
                    WHERE produto_id = %s
                """, (produto_id,))

                cursor.execute("""
                    DELETE FROM produtos
                    WHERE id = %s
                    RETURNING id
                """, (produto_id,))

                resultado = cursor.fetchone()

                if not resultado:
                    return jsonify({
                        "mensagem": "Produto não encontrado."
                    }), 404

        return jsonify({
            "mensagem": "Produto excluído com sucesso!"
        })

    except Exception as erro:
        print("Erro ao excluir produto:", erro)
        return jsonify({
            "mensagem": "Não foi possível excluir o produto."
        }), 500

if __name__ == "__main__":
    app.run(debug=True)
