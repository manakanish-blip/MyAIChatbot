
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from collections import defaultdict, deque
from threading import Lock
import os
import time
import logging

load_dotenv()

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# Basic per-visitor rate limiting
request_history = defaultdict(deque)
rate_limit_lock = Lock()

MAX_REQUESTS = 5
TIME_WINDOW = 60  # seconds


def is_rate_limited(ip):
    now = time.time()

    with rate_limit_lock:
        requests = request_history[ip]

        while requests and now - requests[0] > TIME_WINDOW:
            requests.popleft()

        if len(requests) >= MAX_REQUESTS:
            return True

        requests.append(now)
        return False


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    try:
        if client is None:
            return jsonify({
                "reply": "Chatbot configuration error. Please contact the owner."
            }), 500

        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "")

        if not isinstance(user_message, str) or not user_message.strip():
            return jsonify({
                "reply": "Please enter a valid message."
            }), 400

        if len(user_message) > 2000:
            return jsonify({
                "reply": "Your message is too long. Please keep it under 2000 characters."
            }), 400

        # Limit repeated requests from the same visitor
        visitor_ip = request.remote_addr or "unknown"

        if is_rate_limited(visitor_ip):
            return jsonify({
                "reply": "You're sending messages too quickly. Please wait one minute and try again."
            }), 429

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=user_message
        )

        if not response.text:
            return jsonify({
                "reply": "Gemini returned an empty response. Please try again."
            }), 502

        return jsonify({"reply": response.text}), 200

    except Exception as e:
        error_message = str(e)

        logging.exception("Chatbot request failed")

        # Handle Gemini quota and rate-limit errors
        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
            or "quota" in error_message.lower()
        ):
            return jsonify({
                "reply": (
                    "Our chatbot has temporarily reached its free AI usage limit. "
                    "Please try again after the quota resets."
                )
            }), 429

        return jsonify({
            "reply": "Sorry, something went wrong. Please try again later."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
