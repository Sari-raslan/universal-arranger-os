import os, asyncio, math, textwrap
import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageSequenceClip, AudioFileClip, CompositeAudioClip
from moviepy.audio.AudioClip import AudioArrayClip

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except Exception:
    arabic_reshaper = None
    get_display = None

OUT = "ai-videos/output_v2"
CAP = "ai-videos/captions_v2"
PROMPTS = "ai-videos/prompts_v2"
os.makedirs(OUT, exist_ok=True)
os.makedirs(CAP, exist_ok=True)
os.makedirs(PROMPTS, exist_ok=True)

SITE = "https://sari-raslan.github.io/universal-arranger-os/"
PAYPAL = "https://www.paypal.com/ncp/payment/ZB63CA66C98AN"

VIDEOS = [
    {
        "name": "uaos_ar_demo_voice_to_music",
        "lang": "ar",
        "voice": "ar-SA-HamedNeural",
        "title": "حول صوتك إلى موسيقى",
        "script": "تخيل أنك تغني فكرة بسيطة و Universal Arranger OS يحولها إلى ميدي أكوردات وتوزيع موسيقي جاهز لبرامج الإنتاج. هذا هو مستقبل صناعة الموسيقى.",
        "bullets": ["غني الفكرة", "استخرج MIDI", "ابن توزيع موسيقي", "صدر للمشروع"],
        "cta": "جرب الوصول المبكر الآن"
    },
    {
        "name": "uaos_ar_demo_producers",
        "lang": "ar",
        "voice": "ar-SA-HamedNeural",
        "title": "للمنتجين والموسيقيين",
        "script": "لو عندك لحن في بالك لا تتركه يضيع. سجله بصوتك ودع UAOS يساعدك في تحويله إلى مشروع موسيقي قابل للتطوير.",
        "bullets": ["أفكار أسرع", "أكوردات ذكية", "توزيع أولي", "تدفق عمل للإنتاج"],
        "cta": "Universal Arranger OS من AE Platform"
    },
    {
        "name": "uaos_en_demo",
        "lang": "en",
        "voice": "en-US-GuyNeural",
        "title": "Turn Voice Into Music",
        "script": "Sing or hum a melody. Universal Arranger OS helps turn it into MIDI, chords, arrangements, and DAW-ready workflows for creators and producers.",
        "bullets": ["Sing an idea", "Generate MIDI", "Build chords", "Export workflow"],
        "cta": "Join Early Access"
    },
    {
        "name": "uaos_de_demo",
        "lang": "de",
        "voice": "de-DE-ConradNeural",
        "title": "Stimme zu Musik",
        "script": "Singe oder summe eine Idee. Universal Arranger OS hilft dir, daraus MIDI, Akkorde, Arrangements und DAW-fertige Workflows zu erstellen.",
        "bullets": ["Idee aufnehmen", "MIDI erzeugen", "Akkorde bauen", "Workflow exportieren"],
        "cta": "Early Access starten"
    }
]

def is_ar(text):
    return any("\u0600" <= ch <= "\u06FF" for ch in text)

def shape_text(text):
    if is_ar(text) and arabic_reshaper and get_display:
        return get_display(arabic_reshaper.reshape(text))
    return text

def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
    ]
    for f in candidates:
        try:
            return ImageFont.truetype(f, size)
        except:
            pass
    return ImageFont.load_default()

def wrap(text, width):
    if is_ar(text):
        words = text.split()
        lines, cur = [], ""
        for w in words:
            if len(cur + " " + w) <= width:
                cur = (cur + " " + w).strip()
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines
    return textwrap.wrap(text, width=width)

def make_music(duration, path):
    sr = 44100
    t = np.linspace(0, duration, int(sr * duration))
    beat = ((np.sin(2*np.pi*2*t) > 0.92).astype(float)) * 0.09
    pad = 0.055*np.sin(2*np.pi*220*t) + 0.035*np.sin(2*np.pi*330*t) + 0.025*np.sin(2*np.pi*440*t)
    bass = 0.05*np.sin(2*np.pi*55*t)
    audio = np.tanh(pad + bass + beat)
    stereo = np.column_stack([audio, audio])
    AudioArrayClip(stereo, fps=sr).write_audiofile(path, fps=sr, verbose=False, logger=None)

async def make_voice(item):
    path = f"{OUT}/{item['name']}_voice.mp3"
    await edge_tts.Communicate(item["script"], item["voice"], rate="-5%", volume="+0%").save(path)
    return path

def draw_center(draw, xy, text, fnt, fill):
    draw.text(xy, shape_text(text), font=fnt, fill=fill, anchor="mm")

def render_frames(item, duration, fps=12):
    frames = []
    total = int(duration * fps)
    for i in range(total):
        progress = i / max(1, total - 1)
        img = Image.new("RGB", (1080, 1920), (5, 7, 16))
        d = ImageDraw.Draw(img)

        # animated gradient orbs
        for k in range(7):
            cx = 540 + math.sin(progress*math.pi*2 + k) * (230 + k*22)
            cy = 420 + math.cos(progress*math.pi*2 + k*0.7) * (180 + k*18)
            r = 180 + k*18
            col = (30 + k*18, 70 + k*18, 160 + k*10)
            d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=col)

        # dark overlay
        d.rectangle((0,0,1080,1920), fill=(5,7,16,))

        # animated wave lines
        for w in range(9):
            points = []
            ybase = 1230 + w*28
            for x in range(0,1081,20):
                y = ybase + math.sin((x*0.018)+(progress*9)+(w*0.7))*34
                points.append((x,y))
            d.line(points, fill=(80, 200, 255), width=3)

        # glass card
        d.rounded_rectangle((70, 110, 1010, 1780), radius=45, outline=(120,140,255), width=3)
        d.rounded_rectangle((105, 145, 975, 1745), radius=35, fill=(12,16,32))

        draw_center(d, (540, 235), "AE Platform", font(42, True), (165, 190, 255))

        y = 390
        for line in wrap(item["title"], 18):
            draw_center(d, (540, y), line, font(72, True), (255,255,255))
            y += 82

        # microphone / midi visual
        d.rounded_rectangle((420, 610, 660, 830), radius=60, fill=(245,245,255))
        d.rectangle((510, 825, 570, 930), fill=(245,245,255))
        d.rounded_rectangle((440, 920, 640, 960), radius=20, fill=(245,245,255))
        for n in range(8):
            x = 250 + n*75
            h = 60 + math.sin(progress*10+n)*45
            d.rounded_rectangle((x, 1010-h, x+28, 1010+h), radius=14, fill=(110,220,255))

        y = 1110
        for b in item["bullets"]:
            text = " " + b
            draw_center(d, (540, y), text, font(46, True), (235,245,255))
            y += 70

        d.rounded_rectangle((160, 1500, 920, 1615), radius=30, fill=(255,255,255))
        draw_center(d, (540, 1558), item["cta"], font(40, True), (5,7,16))

        draw_center(d, (540, 1690), "Voice  MIDI  Chords  Arrangement", font(32, False), (180,210,255))

        frame_path = f"{OUT}/_frame_{item['name']}_{i:04d}.jpg"
        img.save(frame_path, quality=88)
        frames.append(frame_path)
    return frames

async def main():
    for item in VIDEOS:
        print("Generating:", item["name"])
        voice_path = await make_voice(item)
        voice = AudioFileClip(voice_path)
        duration = max(11, voice.duration + 2)

        music_path = f"{OUT}/{item['name']}_music.mp3"
        make_music(duration, music_path)
        music = AudioFileClip(music_path).volumex(0.22)

        frames = render_frames(item, duration, fps=12)
        clip = ImageSequenceClip(frames, fps=12)
        clip = clip.set_audio(CompositeAudioClip([music, voice]))

        output = f"{OUT}/{item['name']}.mp4"
        clip.write_videofile(output, fps=24, codec="libx264", audio_codec="aac")

        caption = f"{item['title']}\n\n{item['script']}\n\n{SITE}\n{PAYPAL}\n\n#UAOS #AEPlatform #MusicAI #MIDI #MusicProduction"
        with open(f"{CAP}/{item['name']}.txt", "w", encoding="utf-8") as f:
            f.write(caption)

        with open(f"{PROMPTS}/{item['name']}_prompt.txt", "w", encoding="utf-8") as f:
            f.write("Premium vertical AI music technology ad. Singer, microphone, MIDI notes, DAW timeline, glowing waves, futuristic interface, clean SaaS launch style.")

        # cleanup frames
        for fr in frames:
            try:
                os.remove(fr)
            except:
                pass

        print("DONE:", output)

asyncio.run(main())
