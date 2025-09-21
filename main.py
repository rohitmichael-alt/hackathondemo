from scraper import extract_text_from_url
from summariser import summarise_text, generate_title
from geolocator import detect_location
import json, os

from YoutubeScraper import extract_transcript


def process_youtube_video(url):
    print(f"Processing YouTube video: {url}")
    transcript_text = extract_transcript(url)

    print("[debug] First 500 chars of transcript:\n", transcript_text[:500])

    summary = summarise_text(transcript_text)
    print("[summary]\n", summary)

    title = generate_title(transcript_text)
    print("[title]\n", title)

    entry = {
        "source": "YouTube",
        "url": url,
        "title": title,
        "summary": summary,
        "raw_excerpt": transcript_text[:500]
    }

    save_to_json(entry)
    print("[json] Saved entry to geo_news.json")


def save_to_json(data, filename="geo_news.json"):
    base_dir = os.path.dirname(__file__)   
    filepath = os.path.join(base_dir, filename)

    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            try:
                existing = json.load(f)
            except:
                existing = []
    else:
        existing = []

    existing.append(data)

    with open(filepath, "w") as f:
        json.dump(existing, f, indent=2)

    print(f"[json] Saved entry to {filepath}")


def process_news_url(url):
    print(f"Processing URL: {url}")
    article_text = extract_text_from_url(url)
    if not article_text:
        raise ValueError("No article content extracted")

    print("[debug] First 500 chars of article:\n", article_text[:500], "...\n")

    summary = summarise_text(article_text)
    print("[summary]\n", summary)

    location = detect_location(article_text)
    print("[location]", location)

    title = generate_title(article_text)
    print("[title]\n", title)

    save_to_json({
        "source": "News",
        "url": url,
        "title": title,
        "summary": summary,
        "geolocation": location
    })

# This one for newspaper
if __name__ == "__main__":
    try:
        test_url = "https://www.thehindu.com/news/national/india-weather-monsoon-jammu-and-kashmir-flood-delhi-rain-live-updates-september-5-2025/article70014926.ece"
        process_news_url(test_url)
    except Exception as e:
        import traceback
        print("ERROR in main.py:", e)
        traceback.print_exc()

# THIS ONE FOR VIDEO

# if __name__ == "__main__":
#     try:
#         yt_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  
#         process_youtube_video(yt_url)
#     except Exception as e:
#         import traceback
#         print("ERROR in main.py:", e)
#         traceback.print_exc()
