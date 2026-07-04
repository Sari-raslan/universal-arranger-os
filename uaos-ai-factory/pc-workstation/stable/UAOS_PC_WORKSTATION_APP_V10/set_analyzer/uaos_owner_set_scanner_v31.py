import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "owner_set_input"
OUT = Path(__file__).resolve().parent / "analysis_outputs"
PLACEHOLDERS = {"PLACE_YOUR_SET_HERE_READ_ONLY.txt", "DO_NOT_EDIT_ORIGINAL_SET.md", ".gitignore"}

SAMPLE_EXT = {".wav", ".aif", ".aiff", ".ksf", ".mp3", ".flac"}
MULTI_EXT = {".kmp", ".multisample"}
PCM_EXT = {".pcm", ".img", ".bin"}
SOUND_EXT = {".pcg", ".snd", ".prg"}
STYLE_EXT = {".sty", ".stg"}
PERF_EXT = {".prf", ".perf", ".pad"}
TEXT_EXT = {".txt", ".md", ".json", ".csv", ".xml", ".ini"}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def category_for(path, size):
    name = path.name.lower()
    ext = path.suffix.lower()
    if path.is_dir() and path.suffix.upper() == ".SET":
        return "possible_set_folder", 0.8
    if ext in SOUND_EXT:
        return "possible_sound_file", 0.72
    if ext in STYLE_EXT:
        return "possible_style_file", 0.72
    if ext in SAMPLE_EXT:
        return "possible_sample_file", 0.75
    if ext in MULTI_EXT:
        return "possible_multisample_file", 0.7
    if ext in PCM_EXT:
        return "possible_pcm_data", 0.52
    if ext in PERF_EXT:
        return "possible_performance_file", 0.6
    if ext in TEXT_EXT:
        return "possible_text_metadata", 0.8
    if size > 0:
        return "possible_unknown_binary", 0.35
    if "empty" in name or "blank" in name or "init" in name:
        return "possible_unknown_binary", 0.3
    return "possible_unknown_binary", 0.25


def empty_reasons(item):
    reasons = []
    lname = item["file_name"].lower()
    if item["size"] == 0:
        reasons.append("zero size")
    if item["size"] <= 128:
        reasons.append("very small size")
    if any(token in lname for token in ["empty", "blank", "init", "placeholder", "unused"]):
        reasons.append("placeholder-like name")
    return reasons


def relationship_note():
    return {"relationship": "UNKNOWN", "note": "Binary structure is not parsed in V31; relationships are conservative metadata hypotheses."}


def write_json(name, payload):
    (OUT / name).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = [p for p in INPUT.rglob("*") if p.is_file() and p.name not in PLACEHOLDERS]

    if not files:
        msg = "# Empty Input Report\n\nNo owner SET files were found. ضع الست هنا ثم شغل التحليل.\n"
        (OUT / "EMPTY_INPUT_REPORT.md").write_text(msg, encoding="utf-8")

    inventory = []
    by_hash = {}
    for path in files:
        rel = path.relative_to(INPUT)
        size = path.stat().st_size
        digest = sha256(path)
        category, confidence = category_for(path, size)
        item = {
            "relative_path": str(rel),
            "file_name": path.name,
            "extension": path.suffix.lower(),
            "size": size,
            "modified_timestamp": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
            "sha256": digest,
            "category_guess": category,
            "confidence": confidence,
            **relationship_note(),
        }
        inventory.append(item)
        by_hash.setdefault(digest, []).append(item)

    duplicates = [
        {"sha256": digest, "count": len(items), "files": [item["relative_path"] for item in items], "relationship": "HYPOTHESIS"}
        for digest, items in by_hash.items()
        if len(items) > 1
    ]

    empty_candidates = []
    for item in inventory:
        reasons = empty_reasons(item)
        if reasons:
            empty_candidates.append({
                "slot_or_file": item["relative_path"],
                "reason": ", ".join(reasons),
                "confidence": 0.55 if item["size"] == 0 else 0.35,
                "suggested_action": "manual review",
                "relationship": "HYPOTHESIS",
            })

    sampler = [
        {
            "file": item["relative_path"],
            "size": item["size"],
            "sha256": item["sha256"],
            "likely_category": "sample" if item["category_guess"] == "possible_sample_file" else item["category_guess"],
            "duplicate_hash": any(item["sha256"] == dup["sha256"] for dup in duplicates),
            "used_unused_hypothesis": "UNKNOWN",
        }
        for item in inventory
        if item["category_guess"] in {"possible_sample_file", "possible_multisample_file", "possible_pcm_data"}
    ]

    used_unused = {
        "relationship_status": "UNKNOWN",
        "confirmed_used": [],
        "confirmed_unused": [],
        "hypotheses": [
            {"file": item["file"], "hypothesis": "possible unused, needs confirmation" if item["size"] > 5_000_000 else "manual review", "confidence": 0.3}
            for item in sampler
        ],
    }

    write_json("OWNER_SET_INVENTORY_V31.json", inventory)
    with (OUT / "OWNER_SET_INVENTORY_V31.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["relative_path", "file_name", "extension", "size", "modified_timestamp", "sha256", "category_guess", "confidence", "relationship", "note"])
        writer.writeheader()
        writer.writerows(inventory)
    write_json("EMPTY_SLOT_CANDIDATES_V31.json", empty_candidates)
    write_json("DUPLICATE_CANDIDATES_V31.json", duplicates)
    write_json("SAMPLER_FILE_CANDIDATES_V31.json", sampler)
    write_json("USED_UNUSED_HYPOTHESIS_V31.json", used_unused)

    summary = [
        "# Owner SET Analysis Summary V31",
        "",
        f"Total files: {len(inventory)}",
        f"Possible sounds: {sum(1 for item in inventory if item['category_guess'] == 'possible_sound_file')}",
        f"Possible samples: {len(sampler)}",
        f"Possible styles: {sum(1 for item in inventory if item['category_guess'] == 'possible_style_file')}",
        f"Unknown binaries: {sum(1 for item in inventory if item['category_guess'] == 'possible_unknown_binary')}",
        f"Duplicates: {len(duplicates)}",
        f"Empty candidates: {len(empty_candidates)}",
        "",
        "Relationships: UNKNOWN unless a later approved parser confirms them.",
        "Mode: read-only metadata inventory.",
    ]
    (OUT / "OWNER_SET_ANALYSIS_SUMMARY_V31.md").write_text("\n".join(summary), encoding="utf-8")
    print(json.dumps({"status": "PASS_WITH_WARNINGS" if not inventory else "PASS", "files": len(inventory), "outputs": str(OUT)}, indent=2))


if __name__ == "__main__":
    main()
