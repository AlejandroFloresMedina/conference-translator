# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AudioChunk(BaseModel):
    audio_chunk: str
    source_lang: str
    target_lang: str

@app.post("/translate")
def translate_chunk(chunk: AudioChunk):
    # TODO: replace with real STT → Translate → TTS
    # For prototype, just echo back
    return {"translated_audio": chunk.audio_chunk}