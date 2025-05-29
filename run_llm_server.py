from flask import Flask, request, jsonify
from flask_cors import CORS
from src.get_conclusion.get_conclusion import get_fact_check_result
from src.query_generator.generate_query import generate_clean_query
from src.search_utils.search_google import search_articles

app = Flask(__name__)
CORS(app)


@app.route("/generate_query", methods=["POST"])
def handle_generate_query():
    text = request.json.get("text", "")
    title = request.json.get("title", "")

    if not text:
        return jsonify({"error": "Missing text"}), 400

    try:
        query = generate_clean_query(text, title)
        return jsonify({ "query": query })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


@app.route("/search_and_check", methods=["POST"])
def handle_search_and_check():
    claim = request.json.get("claim", "")
    title = request.json.get("title", "")
    current_url = request.json.get("current_url", "")
    if not claim:
        return jsonify({"error": "Missing claim"}), 400

    try:
        refined_query = generate_clean_query(claim, title)
        articles = search_articles(refined_query, exclude_url=current_url)
        print("Total articles returned by search_articles:", len(articles))

        results = []
        for article in articles:
            passage = article["content"] 
            fact_check = get_fact_check_result(claim, passage)

            results.append({
                "title": article["title"],
                "link": article["link"],
                "fact_check": fact_check
            })

        return jsonify({
            "refined_query": refined_query,
            "results": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_conclusion", methods=["POST"])
def handle_request():
    quote = request.json.get("quote", "")
    passage = request.json.get("passage", "")
    if not passage:
        return jsonify({"error": "Missing passage"}), 400 
    try:
        result = get_fact_check_result(quote, passage)
        print(result)
        return jsonify(result)
    except Exception as e:
        return jsonify({ "relation": "error", "extractedQuote": str(e) }), 500


if __name__ == "__main__":
    app.run(port=8888)
