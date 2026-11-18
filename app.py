
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
import os
import traceback

load_dotenv()

app = Flask(__name__)

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key) if api_key else None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    try:
        if client is None:
            return jsonify({"reply": "API key is missing. Check your .env file."}), 500

        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "")

        if not user_message.strip():
            return jsonify({"reply": "Please enter a message."}), 400

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=user_message
        )

        if not response.text:
            return jsonify({"reply": "Gemini returned an empty response."}), 500

        return jsonify({"reply": response.text})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"reply": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
