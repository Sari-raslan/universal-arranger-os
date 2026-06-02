import os, asyncio, textwrap, math
import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, AudioFileClip, CompositeAudioClip
from moviepy.audio.AudioClip import AudioArrayClip

OUT = "ai-videos/output"
CAP = "ai-videos/captions"
PROMPTS = "ai-videos/prompts"
os.makedirs(OUT, exist_ok=True)
os.makedirs(CAP, exist_ok=True)
os.makedirs(PROMPTS, exist_ok=True)

PAYPAL = "https://www.paypal.com/ncp/payment/ZB63CA66C98AN"
SITE = "https://aeplatform.app"

VIDEOS = [
    ("en_01_voice_to_midi", "en-US-GuyNeural", "Voice to MIDI", "Sing one melody. Universal Arranger OS turns it into clean MIDI, chords, and a music production workflow.", "Join Early Access: " + SITE),
    ("en_02_full_song", "en-US-GuyNeural", "From Voice to Full Song", "Hum an idea. UAOS helps create drums, bass, chords, arrangement ideas, and DAW-ready exports.", "Early Access: " + PAYPAL),
    ("en_03_producers", "en-US-GuyNeural", "Built for Producers", "Capture ideas faster. Turn raw melodies into MIDI, arrangements, and production-ready concepts.", "AE Platform presents UAOS"),
    ("ar_01_intro", "ar-SA-HamedNeural", "حول صوتك إلى موسيقى", "غني أو دندن فكرة و Universal Arranger OS يساعدك يحولها إلى ميدي أكوردات وتوزيع موسيقي جاهز.", "اشترك الآن: " + SITE),
    ("ar_02_demo", "ar-SA-HamedNeural", "من دندنة إلى أغنية", "الفكرة بسيطة: تسجل لحن بصوتك والبرنامج يساعدك يبني ميدي أكوردات توزيع وملفات جاهزة للإنتاج.", "الدفع المبكر: " + PAYPAL),
    ("ar_03_creator", "ar-SA-HamedNeural", "للموسيقيين والمنتجين", "UAOS مصمم للمبدعين المنتجين والمغنين الذين يريدون تحويل الأفكار بسرعة إلى موسيقى قابلة للتطوير.", "AE Platform"),
    ("de_01_intro", "de-DE-ConradNeural", "Stimme zu MIDI", "Singe oder summe eine Idee. Universal Arranger OS verwandelt sie in MIDI, Akkorde und DAW-fertige Workflows.", "Early Access: " + SITE),
    ("de_02_producer", "de-DE-ConradNeural", "KI für Musikproduktion", "UAOS hilft Produzenten, musikalische Ideen schneller in Arrangements, Akkorde und Exportformate zu verwandeln.", "Jetzt testen: " + PAYPAL),
    ("es_01_intro", "es-ES-AlvaroNeural", "Convierte tu voz en música", "Canta o tararea una idea. Universal Arranger OS la transforma en MIDI, acordes y flujos listos para producción.", "Acceso anticipado: " + SITE),
    ("es_02_demo", "es-ES-AlvaroNeural", "De melodía a canción", "UAOS ayuda a convertir ideas musicales en arreglos, MIDI, acordes y proyectos listos para tu DAW.", "Únete: " + PAYPAL),
]

def font(size):
    for f in ["arial.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/seguiemj.ttf"]:
        try:
            return ImageFont.truetype(f, size)
        except:
            pass
    return ImageFont.load_default()

def make_frame(name, title, text, cta):
    img = Image.new("RGB", (1080, 1920), (8, 8, 14))
    d = ImageDraw.Draw(img)

    # simple premium gradient dots/waves
    for i in range(80):
        x = int(540 + math.sin(i/5)*420)
        y = int(1050 + i*6)
        r = 3 + (i % 7)
        d.ellipse((x-r, y-r, x+r, y+r), fill=(80, 120, 255))

    d.rounded_rectangle((70, 100, 1010, 1780), radius=40, outline=(80,80,120), width=3)
    d.text((540, 220), "AE Platform", font=font(44), fill=(180,180,255), anchor="mm")
    d.text((540, 360), title, font=font(74), fill=(255,255,255), anchor="mm")

    y = 600
    for line in textwrap.wrap(text, width=28):
        d.text((540, y), line, font=font(46), fill=(235,235,235), anchor="mm")
        y += 66

    d.rounded_rectangle((150, 1380, 930, 1560), radius=30, fill=(255,255,255))
    d.text((540, 1470), cta, font=font(34), fill=(0,0,0), anchor="mm")

    d.text((540, 1680), "Voice  MIDI  Chords  Arrangement  DAW", font=font(34), fill=(200,200,255), anchor="mm")

    path = f"{OUT}/{name}_frame.png"
    img.save(path)
    return path

def make_music(duration, path):
    sr = 44100
    t = np.linspace(0, duration, int(sr*duration))
    audio = (
        0.07*np.sin(2*np.pi*220*t) +
        0.04*np.sin(2*np.pi*330*t) +
        0.04*np.sin(2*np.pi*440*t) +
        0.02*np.sin(2*np.pi*660*t)
    )
    stereo = np.column_stack([audio, audio])
    AudioArrayClip(stereo, fps=sr).write_audiofile(path, fps=sr, verbose=False, logger=None)

async def make_voice(name, voice, script):
    path = f"{OUT}/{name}_voice.mp3"
    await edge_tts.Communicate(script, voice).save(path)
    return path

async def main():
    made = []
    for name, voice, title, text, cta in VIDEOS:
        print("Generating", name)
        voice_path = await make_voice(name, voice, text)
        voice_clip = AudioFileClip(voice_path)
        duration = max(8, voice_clip.duration + 3)

        music_path = f"{OUT}/{name}_music.mp3"
        make_music(duration, music_path)
        music_clip = AudioFileClip(music_path).volumex(0.22)

        frame = make_frame(name, title, text, cta)
        video = ImageClip(frame).set_duration(duration)
        video = video.set_audio(CompositeAudioClip([music_clip, voice_clip]))

        mp4 = f"{OUT}/{name}.mp4"
        video.write_videofile(mp4, fps=30, codec="libx264", audio_codec="aac")
        made.append(mp4)

        caption = f"{title}\n\n{text}\n\n{cta}\n\n#UAOS #AEPlatform #MusicAI #MIDI #MusicProduction #Producer #AItools"
        with open(f"{CAP}/{name}.txt", "w", encoding="utf-8") as f:
            f.write(caption)

        with open(f"{PROMPTS}/{name}_prompt.txt", "w", encoding="utf-8") as f:
            f.write(f"Create a cinematic AI music tech demo video for {title}. Show singer, MIDI notes, DAW timeline, glowing waveforms, futuristic AI arranger, and final CTA: {cta}")

    with open("launch/VIDEOS_READY.txt", "w", encoding="utf-8") as f:
        f.write("UAOS demo videos generated:\n\n" + "\n".join(made))

    print("DONE. Videos generated:")
    for m in made:
        print(m)

asyncio.run(main())
