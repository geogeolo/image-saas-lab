import os
import logging
import requests
import tempfile
from flask import Flask, request, jsonify, send_file, send_from_directory, after_this_request
from gtts import gTTS

# 設定 logging
logging.basicConfig(level=logging.DEBUG)

# 初始化 Flask app
app = Flask(__name__, static_folder="../frontend", static_url_path="")

# Hugging Face 設定
HF_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen1.5-0.5B-Chat"
HF_API_KEY = os.environ.get("HF_API_KEY")
logging.debug("[BOOT] HF_API_KEY is set: %s", bool(HF_API_KEY))

# ======= ROUTE: Dialogue 模型補完 =======
@app.route("/api/dialogue", methods=["POST"])
def generate_dialogue():
    try:
        data = request.get_json()
        user_input = data.get("text", "").strip()
        if not user_input:
            logging.warning("Empty input received.")
            return jsonify({"error": "No input provided."}), 400

        prompt = f"請將這句話補成一段自然對話：{user_input}"
        logging.debug("Prompt to HF: %s", prompt)

        if not HF_API_KEY:
            logging.error("HF_API_KEY is missing")
            return jsonify({"error": "Server misconfiguration: HF_API_KEY not set"}), 500

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.post(
            HF_API_URL,
            headers=headers,
            json={"inputs": prompt},
            timeout=30
        )

        logging.debug("HF status code: %s", res.status_code)
        logging.debug("HF response body: %s", res.text)
        res.raise_for_status()

        result = res.json()
        output = result[0].get("generated_text", "") if isinstance(result, list) else result.get("generated_text", "")
        logging.info("Generated dialogue: %s", output)
        return jsonify({"dialogue": output.strip()})

    except requests.exceptions.RequestException as e:
        logging.exception("Hugging Face request error.")
        return jsonify({"error": f"HuggingFace API error: {str(e)}"}), 500
    except Exception as e:
        logging.exception("Unhandled error in /api/dialogue.")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# ======= ROUTE: 語音合成 =======
@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json()
    text = data.get("text", "").strip()
    lang = data.get("lang", "zh-tw")
    slow = data.get("slow", False)

    if not text:
        return jsonify({"error": "Empty text"}), 400

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

# ======= ROUTE: 靜態頁面載入 =======
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

# ======= Flask 執行入口（僅本地測試用）=======
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
