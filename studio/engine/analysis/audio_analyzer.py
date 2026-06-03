import librosa
import json
import sys
from pathlib import Path

def analyze_audio(path):
    y, sr = librosa.load(path, sr=None)

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

    result = {
        "file": str(path),
        "sample_rate": sr,
        "duration_seconds": librosa.get_duration(y=y, sr=sr),
        "estimated_tempo": float(tempo),
        "beat_count": int(len(beats)),
        "average_brightness": float(centroid.mean()),
        "chroma_average": chroma.mean(axis=1).tolist()
    }

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audio_analyzer.py file.wav")
        sys.exit(1)

    path = Path(sys.argv[1])
    data = analyze_audio(str(path))

    out = path.with_suffix(".audio-analysis.json")
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print("Audio analysis complete:")
    print(out)
