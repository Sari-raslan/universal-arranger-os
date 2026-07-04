import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCAN_OUT = ROOT / "set_analyzer" / "analysis_outputs"
OUT = Path(__file__).resolve().parent / "analysis_outputs"

CHAINS = {
    "Arabic Strings": ["EQ gentle high shelf", "low cut", "light compression", "short room reverb", "optional stereo width"],
    "Bass": ["low control", "compression", "no wide stereo"],
    "Drums": ["punch EQ", "bus compression hint", "room send"],
    "Pads": ["high cut", "wide reverb", "slow attack"],
    "Unknown": ["safe neutral chain", "gain trim", "no destructive processing"],
}


def load_inventory():
    path = SCAN_OUT / "OWNER_SET_INVENTORY_V31.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def classify(name, category):
    lower = name.lower()
    if "string" in lower or "violin" in lower or "arabic" in lower:
        return "Arabic Strings"
    if "bass" in lower:
        return "Bass"
    if "drum" in lower or "perc" in lower or "darbuka" in lower:
        return "Drums"
    if "pad" in lower:
        return "Pads"
    if category == "possible_unknown_binary":
        return "Unknown"
    return "Unknown"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    inventory = load_inventory()
    by_category = {key: [] for key in CHAINS}
    for item in inventory:
        category = classify(item.get("file_name", ""), item.get("category_guess", ""))
        by_category[category].append(item.get("relative_path"))

    plan = {
        "mode": "METADATA_ONLY",
        "no_audio_processing": True,
        "no_sample_modification": True,
        "no_set_write": True,
        "global_goals": [
            "normalize perceived loudness target concept",
            "avoid clipping",
            "organize sounds by category",
            "keep changes as suggestions only"
        ],
        "chains": CHAINS,
        "files_by_category": by_category,
    }
    (OUT / "DSP_UNIFICATION_PLAN_V31.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT / "DSP_BY_CATEGORY_V31.json").write_text(json.dumps(by_category, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = ["# DSP Unification Plan V31", "", "Mode: METADATA_ONLY", "", "No audio processing. No sample modification. No SET write.", ""]
    for category, chain in CHAINS.items():
        lines.append(f"## {category}")
        lines.extend([f"- {step}" for step in chain])
        lines.append("")
    (OUT / "DSP_UNIFICATION_PLAN_V31.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"status": "PASS", "mode": "METADATA_ONLY", "outputs": str(OUT)}, indent=2))


if __name__ == "__main__":
    main()
