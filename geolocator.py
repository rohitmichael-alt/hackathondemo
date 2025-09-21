import spacy
from geopy.geocoders import Nominatim
from collections import Counter

nlp = spacy.load("en_core_web_sm")
geolocator = Nominatim(user_agent="geo_news_app")

INDIAN_LOCATIONS = {
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
    "Puducherry",
    "New Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru",
    "Hyderabad", "Pune", "Jaipur", "Lucknow", "Patna", "Bhopal", "Ahmedabad",
    "Guwahati", "Imphal", "Shillong", "Itanagar", "Gangtok", "Aizawl",
    "Kohima", "Agartala", "Thiruvananthapuram"
}


def detect_location(text):
    doc = nlp(text)
    locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]

    if not locations:
        return None

    counts = Counter(locations)
    most_common, freq = counts.most_common(1)[0]

    tied = [loc for loc, c in counts.items() if c == freq]
    chosen = most_common
    if len(tied) > 1:
        for loc in tied:
            if loc in INDIAN_LOCATIONS:
                chosen = loc
                break

    try:
        geo = geolocator.geocode(chosen, timeout=10, country_codes="IN")
        if geo:
            return {
                "name": chosen,
                "lat": geo.latitude,
                "lon": geo.longitude,
                "all_candidates": locations
            }
    except Exception as e:
        print(f"[geocoder] Failed for {chosen}: {e}")

    return None
