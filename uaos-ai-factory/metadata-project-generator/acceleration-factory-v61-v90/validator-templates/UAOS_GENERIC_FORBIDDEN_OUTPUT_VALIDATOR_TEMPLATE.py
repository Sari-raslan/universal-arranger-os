from pathlib import Path

FORBIDDEN_EXTENSIONS = {".set", ".sty", ".prf", ".prs", ".kst", ".mid", ".wav", ".mp3"}


def find_forbidden_outputs(root):
    return [str(path) for path in Path(root).rglob("*") if path.is_file() and path.suffix.lower() in FORBIDDEN_EXTENSIONS]
