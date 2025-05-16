# src/search_google.py
import requests
from .search_config import API_KEY, CSE_ID
from bs4 import BeautifulSoup

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
        article_content = scrape_article_content(link)
        articles.append({
            "title": title,
            "snippet": snippet,
            "link": link,
            "content": article_content 
        })

    return articles

def scrape_article_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        article = soup.find("article") 
        if article:
            return article.get_text(strip=True)
        else:
            paragraphs = soup.find_all("p")
            return " ".join([p.get_text() for p in paragraphs])

    except requests.exceptions.RequestException as e:
        print(f"Error scraping article {url}: {e}")
        return "Error fetching article content."