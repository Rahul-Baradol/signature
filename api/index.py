from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import yt_dlp
import base64
import requests

app = FastAPI()

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import yt_dlp
import base64
import io

app = FastAPI()

@app.get("/download-audio")
async def download_audio(url: str = Query(..., description="YouTube video URL")):
    buffer = io.BytesIO()

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": "-",
        "quiet": True,
        "noplaylist": True,
        "extract_audio": True,
        "audio_format": "mp3",
        "audio_quality": 0,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "logtostderr": False,
        "progress_hooks": [],
        "nopart": True,
        "buffersize": 16 * 1024,
        "outtmpl": "-",
        "force_overwrites": True,
    }

    # Use yt_dlp to download audio into memory
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        audio_url = info["url"]

        # Download binary data
        
        resp = requests.get(audio_url, stream=True)
        for chunk in resp.iter_content(chunk_size=8192):
            buffer.write(chunk)

    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("utf-8")

    return JSONResponse(content={"buffer": encoded})

