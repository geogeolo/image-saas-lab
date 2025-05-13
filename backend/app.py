# app.py
from flask import Flask, request, jsonify, send_file, send_from_directory, after_this_request
from gtts import gTTS
import tempfile
import os
import requests

app = Flask(__name__, static_folder="../frontend", static_url_path="")

HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"
HF_API_KEY = os.environ.get("HF_API_KEY")  # 請設定你的 Hugging Face Token 環境變數

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route("/api/dialogue", methods=["POST"])
def generate_dialogue():
    data = request.get_json()
    user_input = data.get("text", "")
    if not user_input:
        return {"error": "No input provided."}, 400

    prompt = f"請將這句話補成一段自然對話：{user_input}"
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"inputs": prompt}

    res = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
    if res.status_code != 200:
        return {"error": "HuggingFace API failed", "status_code": res.status_code}, 500

    result = res.json()
    output = result[0].get("generated_text", "") if isinstance(result, list) else result.get("generated_text", "")
    return {"dialogue": output.strip()}

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json()
    text = data.get("text", "").strip()
    lang = data.get("lang", "zh-tw")
    slow = data.get("slow", False)

    if not text:
        return {"error": "Empty text"}, 400

    tts = gTTS(text=text, lang=lang, slow=slow)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        tts.save(fp.name)

    @after_this_request
    def cleanup(response):
        try:
            os.remove(fp.name)
        except Exception:
            pass
        return response

    return send_file(fp.name, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
