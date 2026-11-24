import os
import time
import psycopg2
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

MODELO_PRINCIPAL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
MODELOS_ALTERNATIVOS = [
    MODELO_PRINCIPAL,
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
]

CANDIDATOS_MODELO = []
for m in MODELOS_ALTERNATIVOS:
    if m:
        nome_limpo = m.replace("models/", "").strip()
        if nome_limpo and nome_limpo not in CANDIDATOS_MODELO:
            CANDIDATOS_MODELO.append(nome_limpo)

EXTENSOES_PERMITIDAS = (
    ".html",
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".svg",
    ".ico",
    ".woff2",
    ".ttf",
)


def get_db_connection():
    url_limpa = DATABASE_URL
    if url_limpa:
        url_limpa = (
            url_limpa.replace("&channel_binding=require", "")
            .replace("channel_binding=require&", "")
        )
    return psycopg2.connect(url_limpa)


def chamar_gemini_com_fallback(prompt_usuario, system_instruction=None):
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY não configurada no ambiente.")

    erros_por_modelo = []
    palavras_congestionamento = (
        "high demand",
        "overloaded",
        "unavailable",
        "resource exhausted",
        "try again later",
        "congestion",
    )

    for modelo in CANDIDATOS_MODELO:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{modelo}:generateContent?key={GEMINI_API_KEY}"
        )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_usuario}],
                }
            ]
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            resp = requests.post(url, json=payload, timeout=10)
            dados = resp.json() if resp.content else {}

            if resp.status_code == 200:
                candidatos = dados.get("candidates", [])
                if candidatos:
                    partes = candidatos[0].get("content", {}).get("parts", [])
                    texto = "".join(
                        p.get("text", "") for p in partes if "text" in p
                    ).strip()
                    if texto:
                        return texto, modelo

            msg_erro = (
                dados.get("error", {}).get("message")
                or resp.text
                or f"HTTP {resp.status_code}"
            )
            erros_por_modelo.append(f"{modelo} (HTTP {resp.status_code}): {msg_erro}")

        except requests.RequestException as exc:
            erros_por_modelo.append(f"{modelo} (rede/timeout): {str(exc)}")

    raise RuntimeError(" | ".join(erros_por_modelo))


@app.route("/", methods=["GET"])
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>", methods=["GET"])
def arquivos_estaticos(filename):
    if filename.startswith("api/"):
        return jsonify({"erro": "Rota não encontrada"}), 404

    if not filename.lower().endswith(EXTENSOES_PERMITIDAS):
        return jsonify({"erro": "Arquivo não permitido"}), 403

    return send_from_directory(".", filename)


@app.route("/api/respostas", methods=["POST"])
def receber_formulario():
    dados = request.get_json(silent=True) or {}
    nome = (dados.get("nome") or "").strip()
    email = (dados.get("email") or "").strip()
    mensagem = (dados.get("mensagem") or "").strip()

    if not nome or not email or not mensagem:
        return jsonify({
            "sucesso": False,
            "erro": "Preencha nome, e-mail e mensagem.",
        }), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS respostas_formulario (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                mensagem TEXT NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute(
            "INSERT INTO respostas_formulario (nome, email, mensagem) VALUES (%s, %s, %s)",
            (nome, email, mensagem),
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "sucesso": True,
            "mensagem": "Resposta do formulário salva no Neon com sucesso!",
        }), 201

    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    dados = request.get_json(silent=True) or {}
    mensagem = (
        dados.get("mensagem")
        or dados.get("message")
        or dados.get("prompt")
        or dados.get("pergunta")
        or dados.get("text")
        or dados.get("texto")
        or ""
    ).strip()

    if not mensagem:
        return jsonify({
            "sucesso": False,
            "error": "Envie uma mensagem válida para o chatbot.",
        }), 400

    instrucao_sistema = (
        "Você é o Max, assistente virtual da NutriTech (ecossistema Nutrilab). "
        "Responda de forma breve, clara, prestativa e amigável em português sobre "
        "suplementos (Whey Protein 100%, Creatina Pura, Pré-Treino, Multivitamínico), "
        "snacks e bebidas (barras de cereal, bebidas lácteas), vestuário de performance, "
        "formas de pagamento (10% de desconto no Pix, até 6x sem juros no cartão) e navegação no site."
    )

    try:
        resposta_texto, modelo_usado = chamar_gemini_com_fallback(
            mensagem,
            system_instruction=instrucao_sistema,
        )
        return jsonify({
            "sucesso": True,
            "resposta": resposta_texto,
            "modelo": modelo_usado,
        }), 200

    except Exception as e:
        detalhe = str(e)
        status_code = (
            502
            if any(
                k in detalhe.lower()
                for k in ("502", "503", "429", "high demand", "overloaded", "timeout")
            )
            else 500
        )
        return jsonify({
            "sucesso": False,
            "error": detalhe,
            "status": status_code,
        }), status_code


if __name__ == "__main__":
    app.run(debug=True, port=5000)
