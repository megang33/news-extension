# src/search_google.py
import requests
from .search_config import API_KEY, CSE_ID

def search_articles(query, num_results=3):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": query,
        "key": API_KEY,
        "cx": CSE_ID,
        "num": num_results,
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    results = response.json()

    articles = []
    for item in results.get("items", []):
        title = item.get("title")
        snippet = item.get("snippet")
        link = item.get("link")
        articles.append({
            "title": title,
            "snippet": snippet,
            "link": link
        })

    return articles
