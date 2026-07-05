#!/usr/bin/env python3
from pathlib import Path
import argparse, hashlib, json, sys
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "outputs" / "hash_reports"

def is_usb_like(path: Path) -> bool:
    text = str(path).lower()
    return any(token in text for token in ["usb", "removable", "thumbdrive"])

def inspect(path: Path) -> dict:
    resolved = path.expanduser().resolve()
    if not resolved.exists() or not resolved.is_file():
        raise SystemExit("Input file does not exist or is not a file")
    if is_usb_like(resolved):
        raise SystemExit("USB-like paths are refused by policy")
    h = hashlib.sha256()
    size = 0
    with resolved.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            size += len(chunk)
            h.update(chunk)
    return {"basename": resolved.name, "extension": resolved.suffix, "size": size, "sha256": h.hexdigest(), "input_path_recorded": str(resolved), "read_only": True, "writer_implemented": False, "korg_output": False}

def main(argv=None):
    parser = argparse.ArgumentParser(description="UAOS read-only hash inspector")
    parser.add_argument("path", help="Owner-provided local fixture path")
    args = parser.parse_args(argv)
    report = inspect(Path(args.path))
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / (report["basename"] + ".hash_report.json")
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(out)
if __name__ == "__main__":
    main()
