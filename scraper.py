import requests
from bs4 import BeautifulSoup

def extract_text_from_url(url):
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        selectors = [
            {"name": "div", "class_": "articlebodycontent"},
            {"name": "div", "class_": "content-body"},
            {"name": "div", "class_": "article"},
            {"name": "section", "class_": "article"},
        ]

        article = None
        for sel in selectors:
            article = soup.find(sel["name"], class_=sel.get("class_"))
            if article:
                break

        if not article:
            print("[scraper] No article content found")
            return None

        text = article.get_text(" ", strip=True)
        print(f"[scraper] Extracted text length: {len(text)}")
        return text

    except Exception as e:
        print(f"[scraper] Error extracting article: {e} on URL {url}")
        return None
