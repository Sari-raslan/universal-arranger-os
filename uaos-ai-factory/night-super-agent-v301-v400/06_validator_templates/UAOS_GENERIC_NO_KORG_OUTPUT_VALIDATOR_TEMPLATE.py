from pathlib import Path
FORBIDDEN = ('.sty','.set','.prs','.prf','.kst')
def validate(root):
    return [p for p in Path(root).rglob('*') if p.is_file() and p.suffix.lower() in FORBIDDEN]
