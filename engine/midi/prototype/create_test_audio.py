import numpy as np
import soundfile as sf

sr = 22050
duration = 3
t = np.linspace(0, duration, int(sr * duration), False)

# Simple A4 test tone
audio = 0.3 * np.sin(2 * np.pi * 440 * t)

sf.write("input.wav", audio, sr)
print("input.wav created")
