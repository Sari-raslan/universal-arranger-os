#!/usr/bin/env python3
from pathlib import Path
import argparse, hashlib, json, string
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "outputs" / "parser_reports"

def blocked_path(path: Path) -> bool:
    return any(token in str(path).lower() for token in ["usb", "removable", "thumbdrive"])

def sha256_and_size(path: Path):
    h = hashlib.sha256(); size = 0
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            size += len(chunk); h.update(chunk)
    return h.hexdigest(), size

def ascii_preview(data: bytes) -> str:
    printable = set(string.printable) - set("\x0b\x0c")
    return "".join(chr(b) if chr(b) in printable and b >= 32 else "." for b in data)

def inspect(path: Path, max_bytes: int = 4096) -> dict:
    resolved = path.expanduser().resolve()
    if not resolved.exists() or not resolved.is_file():
        raise SystemExit("Input file does not exist or is not a file")
    if blocked_path(resolved):
        raise SystemExit("USB-like paths are refused by policy")
    max_bytes = max(1, min(max_bytes, 4096))
    digest, size = sha256_and_size(resolved)
    with resolved.open("rb") as fh:
        header = fh.read(max_bytes)
    # Generic chunk-like scan only: records offsets of uppercase ASCII runs; no format interpretation.
    runs = []
    start = None
    for i, b in enumerate(header):
        is_upper = 65 <= b <= 90 or 48 <= b <= 57 or b == 95
        if is_upper and start is None:
            start = i
        if (not is_upper or i == len(header)-1) and start is not None:
            end = i if not is_upper else i + 1
            if end - start >= 4:
                runs.append({"offset": start, "token": header[start:end].decode("ascii", errors="ignore"), "classification": "UNKNOWN/UNCONFIRMED"})
            start = None
    return {"basename": resolved.name, "extension": resolved.suffix, "size": size, "sha256": digest, "bytes_scanned": len(header), "hex_preview": header.hex(" "), "ascii_safe_preview": ascii_preview(header), "observed_tokens": runs, "format_interpretation": "UNKNOWN/UNCONFIRMED", "read_only": True, "binary_mutation": False, "writer_implemented": False, "korg_output": False, "compatibility_claim": False}

def main(argv=None):
    parser = argparse.ArgumentParser(description="UAOS KORG read-only parser scaffold")
    parser.add_argument("path")
    parser.add_argument("--max-bytes", type=int, default=4096)
    args = parser.parse_args(argv)
    report = inspect(Path(args.path), args.max_bytes)
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / (report["basename"] + ".readonly_parser_report.json")
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(out)
if __name__ == "__main__":
    main()
