import re
import subprocess
import os
import tempfile

def extract_transcript(url: str) -> str:
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            outfile = os.path.join(tmpdir, "%(id)s.%(ext)s")

            result = subprocess.run(
                [
                    "yt-dlp",
                    "--skip-download",
                    "--write-auto-subs", "--sub-lang", "en",
                    "--sub-format", "vtt",
                    "-o", outfile,
                    url,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            vtt_files = [f for f in os.listdir(tmpdir) if f.endswith(".vtt")]
            if not vtt_files:
                raise RuntimeError("No subtitles file created")

            vtt_path = os.path.join(tmpdir, vtt_files[0])
            with open(vtt_path, "r", encoding="utf-8") as f:
                subs_data = f.read()

            cleaned_lines = []
            for line in subs_data.splitlines():
                if line.startswith("WEBVTT") or re.match(r"^\d+$", line.strip()):
                    continue
                if re.match(r"\d{2}:\d{2}:\d{2}\.\d{3}", line):
                    continue
                line = re.sub(r"<[^>]+>", "", line)
                if line.strip():
                    cleaned_lines.append(line.strip())

            return " ".join(cleaned_lines)

    except Exception as e:
        raise RuntimeError(f"Failed to fetch transcript: {e}")
