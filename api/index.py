from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import yt_dlp
import base64
import requests
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Accept all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/download-audio")
async def download_audio(url: str = Query(..., description="YouTube video URL")):
    ydl_opts = {
        "format": "bestaudio/best",
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
        "outtmpl": "audio",
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Read the audio file and encode it as base64
    with open("audio.mp3", "rb") as audio_file:
        audio_data = audio_file.read()
        encoded_audio = base64.b64encode(audio_data).decode("utf-8")

    # Return the base64-encoded audio data
    return JSONResponse(content={"buffer": encoded_audio})
