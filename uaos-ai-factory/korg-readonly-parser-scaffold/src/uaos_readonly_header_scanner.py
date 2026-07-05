#!/usr/bin/env python3
from pathlib import Path
import argparse, json, string
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "outputs" / "header_reports"

def safe_ascii(data: bytes) -> str:
    allowed = set(string.printable) - set("\x0b\x0c")
    return "".join(chr(b) if chr(b) in allowed and b >= 32 else "." for b in data)

def scan(path: Path, max_bytes: int = 4096) -> dict:
    resolved = path.expanduser().resolve()
    if not resolved.exists() or not resolved.is_file():
        raise SystemExit("Input file does not exist or is not a file")
    if any(token in str(resolved).lower() for token in ["usb", "removable", "thumbdrive"]):
        raise SystemExit("USB-like paths are refused by policy")
    max_bytes = max(1, min(max_bytes, 4096))
    with resolved.open("rb") as fh:
        data = fh.read(max_bytes)
    return {"basename": resolved.name, "bytes_read": len(data), "max_bytes": max_bytes, "hex_preview": data.hex(" "), "ascii_safe_preview": safe_ascii(data), "format_interpretation": "UNKNOWN/UNCONFIRMED", "read_only": True, "compatibility_claim": False}

def main(argv=None):
    parser = argparse.ArgumentParser(description="UAOS read-only header scanner")
    parser.add_argument("path")
    parser.add_argument("--max-bytes", type=int, default=4096)
    args = parser.parse_args(argv)
    report = scan(Path(args.path), args.max_bytes)
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / (report["basename"] + ".header_report.json")
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(out)
if __name__ == "__main__":
    main()
