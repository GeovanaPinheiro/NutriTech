import os
import time
import requests
from flask import Flask, jsonify, request

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

MODELO_PRINCIPAL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
MODELOS_ALTERNATIVOS = [
    MODELO_PRINCIPAL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]

CANDIDATOS_MODELO = []
for m in MODELOS_ALTERNATIVOS:
    if m:
        nome_limpo = m.replace("models/", "").strip()
        if nome_limpo and nome_limpo not in CANDIDATOS_MODELO:
            CANDIDATOS_MODELO.append(nome_limpo)


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

        # Até 2 tentativas rápidas no mesmo modelo caso seja apenas um pico passageiro
        for tentativa in range(1, 3):
            try:
                resp = requests.post(url, json=payload, timeout=20)
                dados = resp.json() if resp.content else {}

                if resp.status_code == 200:
                    candidatos = dados.get("candidates", [])
                    if candidatos:
                        partes = candidatos[0].get("content", {}).get("parts", [])
                        texto = "".join(p.get("text", "") for p in partes if "text" in p).strip()
                        if texto:
                            return texto, modelo

                msg_erro = (
                    dados.get("error", {}).get("message")
                    or resp.text
                    or f"HTTP {resp.status_code}"
                )
                msg_lower = msg_erro.lower()

                eh_sobrecarga = (
                    resp.status_code in (429, 502, 503, 504)
                    or any(p in msg_lower for p in palavras_congestionamento)
                )

                erros_por_modelo.append(f"{modelo} (HTTP {resp.status_code}): {msg_erro}")

                # Se for sobrecarga momentânea, faz 1 retry curto antes de pular para o próximo modelo
                if eh_sobrecarga and tentativa < 2:
                    time.sleep(1.2)
                    continue

                # Se for 404 (modelo indisponível/não encontrado) ou falhou após retry, passa para o próximo modelo
                break

            except requests.RequestException as exc:
                erros_por_modelo.append(f"{modelo} (rede/timeout): {str(exc)}")
                if tentativa < 2:
                    time.sleep(1.2)
                    continue
                break

    raise RuntimeError(" | ".join(erros_por_modelo))


@app.route("/api/chat", methods=["POST"])
def chat():
    dados = request.get_json(silent=True) or {}
    mensagem = (dados.get("mensagem") or dados.get("message") or "").strip()

    if not mensagem:
        return jsonify({
            "sucesso": False,
            "error": "Envie uma mensagem válida para o chatbot."
        }), 400

    instrucao_sistema = (
        "Você é o assistente virtual do NutriTech. Responda de forma clara, "
        "objetiva e prestativa em português."
    )

    try:
        resposta_texto, modelo_usado = chamar_gemini_com_fallback(
            mensagem,
            system_instruction=instrucao_sistema
        )
        return jsonify({
            "sucesso": True,
            "resposta": resposta_texto,
            "modelo": modelo_usado
        }), 200

    except Exception as e:
        detalhe = str(e)
        status_code = 502 if any(k in detalhe.lower() for k in ("502", "503", "429", "high demand", "overloaded", "timeout")) else 500
        return jsonify({
            "sucesso": False,
            "error": detalhe,
            "status": status_code
        }), status_code
