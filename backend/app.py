from flask import Flask, request, send_file
from gtts import gTTS
import tempfile
import os

app = Flask(__name__)

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "en")
    tts = gTTS(text=text, lang=lang)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        tts.save(fp.name)
        return send_file(fp.name, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run()
