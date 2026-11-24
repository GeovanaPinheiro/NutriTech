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
                        p.get("text", "") for p in partes
