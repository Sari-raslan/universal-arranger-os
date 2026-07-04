import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCAN = ROOT / "set_analyzer" / "analysis_outputs"
OUT = Path(__file__).resolve().parent / "analysis_outputs"


def load(name, fallback):
    path = SCAN / name
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    inventory = load("OWNER_SET_INVENTORY_V31.json", [])
    sampler = load("SAMPLER_FILE_CANDIDATES_V31.json", [])
    empty = load("EMPTY_SLOT_CANDIDATES_V31.json", [])
    duplicate_hashes = {}
    for item in inventory:
        duplicate_hashes.setdefault(item.get("sha256"), []).append(item)

    suggestions = []
    manual = []
    for slot in empty:
        suggestions.append({
            "empty_or_weak_item": slot.get("slot_or_file"),
            "suggested_replacement": "manual review",
            "confidence": "LOW",
            "reason": slot.get("reason", "heuristic empty candidate"),
            "relationship": "HYPOTHESIS",
        })
        manual.append(f"- {slot.get('slot_or_file')}: {slot.get('reason')}")

    for item in sampler:
        file_name = item.get("file", "")
        lower = file_name.lower()
        if "string" in lower or "violin" in lower or "arabic" in lower:
            suggestions.append({
                "empty_or_weak_item": "Arabic strings related target",
                "suggested_replacement": "Arabic Strings Tremolo Light",
                "confidence": "MEDIUM_NAME_MATCH",
                "reason": f"name suggests strings family: {file_name}",
                "relationship": "HYPOTHESIS",
            })
        if item.get("size", 0) > 5_000_000:
            suggestions.append({
                "empty_or_weak_item": file_name,
                "suggested_replacement": "possible unused, needs confirmation",
                "confidence": "LOW",
                "reason": "large sample-like file with no confirmed reference map",
                "relationship": "UNKNOWN",
            })

    duplicate_plan = []
    for digest, items in duplicate_hashes.items():
        if digest and len(items) > 1:
            duplicate_plan.append({
                "sha256": digest,
                "keep_candidate": items[0].get("relative_path"),
                "possible_unused_candidates": [item.get("relative_path") for item in items[1:]],
                "relationship": "HYPOTHESIS",
            })

    fill_plan = {
        "mode": "HYPOTHESIS_ONLY",
        "empty_slot_count": len(empty),
        "suggestions": suggestions,
        "duplicate_plan": duplicate_plan,
    }
    (OUT / "REPLACEMENT_SUGGESTIONS_V31.json").write_text(json.dumps(suggestions, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT / "EMPTY_SLOT_FILL_PLAN_V31.json").write_text(json.dumps(fill_plan, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = ["# Replacement Suggestions V31", "", "Mode: HYPOTHESIS_ONLY", "", "No confirmed mappings are claimed.", ""]
    for item in suggestions:
        lines.append(f"- {item['empty_or_weak_item']} -> {item['suggested_replacement']} ({item['confidence']})")
    (OUT / "REPLACEMENT_SUGGESTIONS_V31.md").write_text("\n".join(lines), encoding="utf-8")
    (OUT / "MANUAL_REVIEW_REQUIRED_V31.md").write_text("# Manual Review Required V31\n\n" + ("\n".join(manual) if manual else "No manual review items yet. Waiting for owner SET input.\n"), encoding="utf-8")
    print(json.dumps({"status": "PASS", "mode": "HYPOTHESIS_ONLY", "suggestions": len(suggestions)}, indent=2))


if __name__ == "__main__":
    main()
