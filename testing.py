# from summariser import generate_title

# article_text = """The Union Home Ministry and the Manipur government signed a Suspension of Operations (SoO) pact..."""
# print("[title]", generate_title(article_text))

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

video_id = "IDFPJSZq8UM"

try:
    transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
    print("Transcript found! Sample lines:")
    for entry in transcript[:5]:
        print(f"{entry['start']:.2f}s: {entry['text']}")
except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as e:
    print("No transcript available for this video.")
except Exception as e:
    print(f"Error fetching transcript: {e}")
