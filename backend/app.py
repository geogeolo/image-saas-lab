import os
import requests
import logging
from flask import Flask, request, send_file, send_from_directory, after_this_request, jsonify
from gtts import gTTS
import tempfile

logging.basicConfig(level=logging.DEBUG)  # 開啟 debug 訊息

app = Flask(__name__, static_folder="../frontend", static_url_path="")

HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"
HF_API_KEY = os.environ.get("HF_API_KEY")
logging.debug("[BOOT] HF_API_KEY is set: %s", bool(HF_API_KEY))


@app.route("/api/dialogue", methods=["POST"])
def generate_dialogue():
    try:
        data = request.get_json()
        user_input = data.get("text", "").strip()
        if not user_input:
            logging.warning("Empty input received.")
            return {"error": "No input provided."}, 400

        prompt = f"請將這句話補成一段自然對話：{user_input}"
        logging.debug("Prompt to HF: %s", prompt)

        if HF_API_KEY is None:
            logging.error("HF_API_KEY is missing")
            return {"error": "HF_API_KEY not set on server"}, 500

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.post(HF_API_URL, headers=headers, json={"inputs": prompt}, timeout=30)
        logging.debug("HF API response code: %s", res.status_code)
        logging.debug("HF API raw response: %s", res.text)

        res.raise_for_status()

        result = res.json()
        output = result[0].get("generated_text", "") if isinstance(result, list) else result.get("generated_text", "")
        logging.debug("Extracted output: %s", output)
        return jsonify({"dialogue": output.strip()})

    except requests.exceptions.RequestException as e:
        logging.exception("HuggingFace request failed.")
        return {"error": f"HuggingFace API error: {str(e)}"}, 500
    except Exception as e:
        logging.exception("Unexpected server error.")
        return {"error": f"Internal server error: {str(e)}"}, 500
