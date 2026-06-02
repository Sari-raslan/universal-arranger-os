import os
import asyncio
import edge_tts
import numpy as np
from moviepy.editor import *
from moviepy.audio.AudioClip import AudioArrayClip

OUT = "ai-videos/output"
os.makedirs(OUT, exist_ok=True)

videos = {
    "en": {
        "voice": "en-US-GuyNeural",
        "title": "Universal Arranger OS",
        "text": "Turn your voice into music. Sing, hum, or play an idea, and Universal Arranger OS helps transform it into MIDI, chords, arrangements, and DAW-ready workflows. Built by AE Platform for musicians, producers, and creators.",
        "cta": "Join Early Access: https://aeplatform.app"
    },
    "ar": {
        "voice": "ar-SA-HamedNeural",
        "title": "يونيفرسال أرينجر أو إس",
        "text": "حول صوتك إلى موسيقى. غني أو دندن فكرة و Universal Arranger OS يساعدك يحولها إلى ميدي أكوردات توزيع موسيقي وملفات جاهزة لبرامج الإنتاج.",
        "cta": "اشترك الآن: https://aeplatform.app"
    },
    "de": {
        "voice": "de-DE-ConradNeural",
        "title": "Universal Arranger OS",
        "text": "Verwandle deine Stimme in Musik. Singe, summe oder spiele eine Idee, und Universal Arranger OS hilft dir, daraus MIDI, Akkorde, Arrangements und DAW-fertige Workflows zu erstellen.",
        "cta": "Early Access: https://aeplatform.app"
    },
    "es": {
        "voice": "es-ES-AlvaroNeural",
        "title": "Universal Arranger OS",
        "text": "Convierte tu voz en música. Canta, tararea o toca una idea, y Universal Arranger OS ayuda a convertirla en MIDI, acordes, arreglos y flujos listos para tu DAW.",
        "cta": "Acceso anticipado: https://aeplatform.app"
    }
}

async def make_voice(lang, text, voice):
    path = f"{OUT}/{lang}_voice.mp3"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(path)
    return path

def make_music(duration, path):
    sr = 44100
    t = np.linspace(0, duration, int(sr * duration))
    audio = 0.08*np.sin(2*np.pi*220*t) + 0.05*np.sin(2*np.pi*440*t) + 0.03*np.sin(2*np.pi*660*t)
    stereo = np.column_stack([audio, audio])
    AudioArrayClip(stereo, fps=sr).write_audiofile(path, fps=sr)

async def main():
    for lang, data in videos.items():
        voice_path = await make_voice(lang, data["text"], data["voice"])
        voice = AudioFileClip(voice_path)
        duration = voice.duration + 3

        music_path = f"{OUT}/{lang}_music.mp3"
        make_music(duration, music_path)
        music = AudioFileClip(music_path).volumex(0.35)

        bg = ColorClip(size=(1080, 1920), color=(8,8,12), duration=duration)

        title = TextClip(data["title"], fontsize=74, color="white", method="caption", size=(950, None)).set_position(("center", 220)).set_duration(duration)

        body = TextClip(data["text"], fontsize=44, color="white", method="caption", size=(900, None)).set_position(("center", 520)).set_duration(duration)

        cta = TextClip(data["cta"], fontsize=42, color="white", method="caption", size=(950, None)).set_position(("center", 1500)).set_duration(duration)

        video = CompositeVideoClip([bg, title, body, cta])
        video = video.set_audio(CompositeAudioClip([music, voice]))

        output = f"{OUT}/uaos_launch_{lang}.mp4"
        video.write_videofile(output, fps=30, codec="libx264", audio_codec="aac")

        with open(f"ai-videos/captions/{lang}.txt", "w", encoding="utf-8") as f:
            f.write(data["text"] + "\n\n" + data["cta"])

        with open(f"ai-videos/prompts/{lang}_ai_video_prompt.txt", "w", encoding="utf-8") as f:
            f.write(f"""Create a cinematic vertical launch video for Universal Arranger OS by AE Platform.

Mood: futuristic, musical, clean, premium, inspiring.
Visuals: singer humming into microphone, MIDI notes appearing, piano roll, DAW timeline, glowing music waves, AI arrangement engine, final call to action.
Language: {lang}
Message: {data['text']}
CTA: {data['cta']}
Format: 9:16 vertical, TikTok, Instagram Reels, YouTube Shorts.
Style: modern SaaS music technology launch trailer.
""")

asyncio.run(main())
