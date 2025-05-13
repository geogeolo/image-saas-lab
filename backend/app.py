import logging
import os
import requests
from flask import request, jsonify

HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"
HF_API_KEY = os.environ.get("HF_API_KEY")

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
            logging.error("HF_API_KEY is missing or unset.")
            return jsonify({"error": "Server misconfiguration: HF_API_KEY not set"}), 500

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json"
        }

        # 發送 Hugging Face 請求
        response = requests.post(
            HF_API_URL,
            headers=headers,
            json={"inputs": prompt},
            timeout=30
        )

        logging.debug("HF status code: %s", response.status_code)
        logging.debug("HF response body: %s", response.text)

        response.raise_for_status()

        result = response.json()
        if isinstance(result, list):
            output = result[0].get("generated_text", "")
        else:
            output = result.get("generated_text", "")

        logging.info("Generated dialogue: %s", output)
        return jsonify({"dialogue": output.strip()})

    except requests.exceptions.RequestException as e:
        logging.exception("Hugging Face request error.")
        return jsonify({"error": f"HuggingFace API error: {str(e)}"}), 500

    except Exception as e:
        logging.exception("Unhandled error in /api/dialogue.")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
