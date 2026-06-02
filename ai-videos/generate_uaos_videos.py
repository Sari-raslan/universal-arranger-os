import os
import asyncio
import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, AudioFileClip, CompositeAudioClip

OUT = "ai-videos/output"
os.makedirs(OUT, exist_ok=True)

videos = {
    "en": {
        "voice": "en-US-GuyNeural",
        "title": "Universal Arranger OS",
        "text": "Turn your voice into music. Sing, hum, or play an idea, and UAOS helps transform it into MIDI, chords, arrangements, and DAW-ready workflows.",
        "cta": "Join Early Access: https://aeplatform.app"
    },
    "ar": {
        "voice": "ar-SA-HamedNeural",
        "title": "يونيفرسال أرينجر أو إس",
        "text": "حول صوتك إلى موسيقى. غني أو دندن فكرة وUAOS يساعدك يحولها إلى ميدي أكوردات توزيع موسيقي وملفات جاهزة لبرامج الإنتاج.",
        "cta": "اشترك الآن: https://aeplatform.app"
    },
    "de": {
        "voice": "de-DE-ConradNeural",
        "title": "Universal Arranger OS",
        "text": "Verwandle deine Stimme in Musik. Singe, summe oder spiele eine Idee, und UAOS hilft dir, daraus MIDI, Akkorde, Arrangements und DAW-fertige Workflows zu erstellen.",
        "cta": "Early Access: https://aeplatform.app"
    },
    "es": {
        "voice": "es-ES-AlvaroNeural",
        "title": "Universal Arranger OS",
        "text": "Convierte tu voz en música. Canta, tararea o toca una idea, y UAOS ayuda a convertirla en MIDI, acordes, arreglos y flujos listos para tu DAW.",
        "cta": "Acceso anticipado: https://aeplatform.app"
    }
}

async def make_voice(lang, text, voice):
    path = f"{OUT}/{lang}_voice.mp3"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(path)
    return path

def make_music(duration, path):
    from moviepy.audio.AudioClip import AudioArrayClip
    sr = 44100
    t = np.linspace(0, duration, int(sr * duration))
    audio = 0.08*np.sin(2*np.pi*220*t) + 0.05*np.sin(2*np.pi*440*t) + 0.03*np.sin(2*np.pi*660*t)
    stereo = np.column_stack([audio, audio])
    AudioArrayClip(stereo, fps=sr).write_audiofile(path, fps=sr, verbose=False, logger=None)

def wrap_text(text, max_chars=28):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if len(current + " " + word) <= max_chars:
            current = (current + " " + word).strip()
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def make_frame(lang, title, text, cta):
    img = Image.new("RGB", (1080, 1920), (8, 8, 12))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("arial.ttf", 72)
        font_body = ImageFont.truetype("arial.ttf", 44)
        font_cta = ImageFont.truetype("arial.ttf", 42)
    except:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_cta = ImageFont.load_default()

    y = 180
    for line in wrap_text(title, 20):
        draw.text((540, y), line, font=font_title, fill=(255,255,255), anchor="mm")
        y += 90

    y = 520
    for line in wrap_text(text, 30):
        draw.text((540, y), line, font=font_body, fill=(235,235,235), anchor="mm")
        y += 62

    y = 1480
    for line in wrap_text(cta, 28):
        draw.text((540, y), line, font=font_cta, fill=(255,255,255), anchor="mm")
        y += 60

    frame_path = f"{OUT}/{lang}_frame.png"
    img.save(frame_path)
    return frame_path

async def main():
    for lang, data in videos.items():
        print(f"Generating {lang}...")
        voice_path = await make_voice(lang, data["text"], data["voice"])
        voice = AudioFileClip(voice_path)
        duration = voice.duration + 3

        music_path = f"{OUT}/{lang}_music.mp3"
        make_music(duration, music_path)
        music = AudioFileClip(music_path).volumex(0.25)

        frame_path = make_frame(lang, data["title"], data["text"], data["cta"])

        video = ImageClip(frame_path).set_duration(duration).set_audio(CompositeAudioClip([music, voice]))
        output = f"{OUT}/uaos_launch_{lang}.mp4"
        video.write_videofile(output, fps=30, codec="libx264", audio_codec="aac")

        with open(f"ai-videos/captions/{lang}.txt", "w", encoding="utf-8") as f:
            f.write(data["text"] + "\n\n" + data["cta"])

        print(f"Done: {output}")

asyncio.run(main())
