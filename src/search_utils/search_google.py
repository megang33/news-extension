# src/search_google.py
import requests
from .search_config import API_KEY, CSE_ID
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

def get_domain(url):
    try:
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except:
        return ""
    
def search_articles(query, num_results=5, exclude_url=None):
    fetch_limit = 10
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": query,
        "key": API_KEY,
        "cx": CSE_ID,
        "num": fetch_limit,
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    results = response.json()

    articles = []
    seen_links = set()

    for item in results.get("items", []):
        title = item.get("title")
        snippet = item.get("snippet")
        link = item.get("link")

        # skip the article current link
        if exclude_url and link.strip("/") == exclude_url.strip("/"):
            continue

        # skip duplicate links
        if link in seen_links:
            continue
        seen_links.add(link)

        # skip home page links
        if link.endswith("/") or link.count("/") <= 3:
            continue

        article_content = scrape_article_content(link)
        articles.append({
            "title": title,
            "snippet": snippet,
            "link": link,
            "content": article_content 
    })
        
        if len(articles) >= num_results:
            break

    return articles

def scrape_article_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        article = soup.find("article")
        if article:
            text = article.get_text()
        else:
            paragraphs = soup.find_all("p")
            text = " ".join([p.get_text() for p in paragraphs])

        text = re.sub(r'([.!?])([^\s])', r'\1 \2', text)

        return text.strip()

    except requests.exceptions.RequestException as e:
        print(f"Error scraping article {url}: {e}")
        return "Error fetching article content."