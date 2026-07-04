import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "analysis_outputs"
SCAN = ROOT / "set_analyzer" / "analysis_outputs"
DSP = ROOT / "dsp_planner" / "analysis_outputs"
REPL = ROOT / "replacement_engine" / "analysis_outputs"
V32 = ROOT / "results_dashboard" / "analysis_outputs"
OWNER_INPUT = ROOT / "owner_set_input"

KEYWORDS = {
    "Arabic Strings": ["strings", "violin", "kaman", "kman", "كمان", "كمنجات", "وتر"],
    "Bass": ["bass", "باس"],
    "Drums": ["drum", "kit", "drums", "درام"],
    "Percussion": ["perc", "darbuka", "طبلة"],
    "Oud/Qanun/Nay": ["oud", "qanun", "nay", "عود", "قانون", "ناي"],
    "Pad": ["pad"],
    "Lead": ["lead", "synth", "piano", "organ", "brass", "mizmar", "مزمار"],
}

CHAIN = {
    "Arabic Strings": "low cut + light compression + short room reverb",
    "Bass": "low control + compression + mono focus",
    "Drums": "punch EQ + bus compression hint + room send",
    "Percussion": "transient control + light room send",
    "Oud/Qanun/Nay": "gentle presence EQ + short room",
    "Pad": "high cut + wide reverb + slow attack",
    "Lead": "presence EQ + delay/reverb send",
    "Unknown": "safe neutral chain + gain trim",
}


def load_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(name, payload):
    (OUT / name).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def write_csv(name, rows, columns):
    with (OUT / name).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in columns})


def classify(item):
    path = item.get("relative_path", "")
    upper = path.upper()
    ext = item.get("extension", "").lower()
    parts = upper.replace("/", "\\").split("\\")
    if ".SET" in upper:
        set_structure = True
    else:
        set_structure = False
    if "STYLE" in parts or ext == ".sty":
        return "likely_style_container", 0.78, "STYLE folder or style extension"
    if "SOUND" in parts or ext in [".pcg", ".prg"]:
        return "likely_sound_container", 0.66, "SOUND folder or program extension"
    if "PCM" in parts or ext == ".pcm":
        return "likely_pcm", 0.68, "PCM folder or extension"
    if "MULTISMP" in parts or ext == ".kmp":
        return "likely_multisample", 0.68, "MULTISMP folder or multisample extension"
    if "SAMPLE" in parts or ext in [".ksf", ".wav", ".aiff", ".aif", ".mp3"]:
        return "likely_sample", 0.68, "SAMPLE folder or sample-like extension"
    if "GLOBAL" in parts or ext == ".gbl":
        return "likely_global", 0.62, "GLOBAL folder or global extension"
    if "SONGBOOK" in parts or ext == ".sbd":
        return "likely_songbook", 0.62, "SONGBOOK folder or songbook extension"
    if ext in [".txt", ".md", ".json", ".csv", ".mid"]:
        return "text_metadata", 0.75, "text or MIDI metadata extension"
    if item.get("category_guess") == "possible_performance_file" or ext in [".pad", ".prf"]:
        return "likely_sound_container", 0.48, "performance or pad-like metadata"
    return "unknown_binary", 0.32 if set_structure else 0.25, "not safely parsed"


def dsp_category(text):
    lower = text.lower()
    for category, terms in KEYWORDS.items():
        if any(term.lower() in lower for term in terms):
            return category, 0.58, "instrument keyword match"
    if "STYLE" in text.upper():
        return "Drums", 0.35, "style container may include rhythm; manual review"
    return "Unknown", 0.25, "no instrument keyword"


def bank_slot(path):
    guesses = []
    for pattern in [r"USER\d+", r"USERDK", r"USER", r"FAVORITE", r"BANK\d+", r"SOUND\d+", r"PRG\d+", r"STYLE\d+"]:
        matches = re.findall(pattern, path.upper())
        guesses.extend(matches)
    numbers = re.findall(r"(?<!\d)(\d{2,3})(?!\d)", path)
    guesses.extend([f"number_{n}" for n in numbers[:2]])
    return ", ".join(dict.fromkeys(guesses)) or "manual_review"


def weak_reason(item, classification):
    name = item.get("file_name", "").lower()
    size = item.get("size", 0)
    reasons = []
    if size == 0:
        reasons.append("zero size")
    if size < 2048 and classification in ["unknown_binary", "likely_global"]:
        reasons.append("very small binary/metadata")
    if any(token in name for token in ["empty", "init", "blank", "default", "new", "no name", "unused"]):
        reasons.append("placeholder-like name")
    if classification == "unknown_binary" and size < 4096:
        reasons.append("unknown and small")
    return reasons


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    inventory = load_json(SCAN / "OWNER_SET_INVENTORY_V31.json", [])
    v32_summary = load_json(V32 / "V32_OWNER_RESULTS_SUMMARY.json", {})

    classifications = []
    bank_rows = []
    weak_rows = []
    dsp_rows = []
    by_hash = defaultdict(list)
    sampler_groups = defaultdict(list)

    set_structure = any(".SET" in item.get("relative_path", "").upper() for item in inventory)

    for item in inventory:
        path = item.get("relative_path", "")
        cls, cls_conf, reason = classify(item)
        cat, dsp_conf, dsp_reason = dsp_category(path)
        by_hash[item.get("sha256")].append(item)
        if cls in ["likely_sample", "likely_multisample", "likely_pcm"]:
            key = f"{Path(path).parent}|{item.get('extension')}|{cat}"
            sampler_groups[key].append(item)
        classifications.append({
            "file": path,
            "extension": item.get("extension"),
            "size": item.get("size"),
            "classification": cls,
            "confidence": cls_conf,
            "relationship": "HYPOTHESIS_ONLY",
            "reason": reason,
        })
        bank_rows.append({
            "file": path,
            "bank_slot_guess": bank_slot(path),
            "confidence": "low" if "manual_review" in bank_slot(path) else "medium",
            "reason": "path/name pattern only",
        })
        reasons = weak_reason(item, cls)
        if reasons:
            weak_rows.append({
                "file": path,
                "reason": "; ".join(reasons),
                "confidence": "low",
                "suggested_action": "manual review",
                "safety": "hypothesis_only_no_write",
            })
        dsp_rows.append({
            "file_or_group": path,
            "category": cat,
            "suggested_chain": CHAIN[cat],
            "confidence": dsp_conf,
            "reason": dsp_reason,
        })

    duplicate_rows = []
    for digest, items in by_hash.items():
        if digest and len(items) > 1:
            duplicate_rows.append({
                "sha256": digest,
                "count": len(items),
                "files": " | ".join(item.get("relative_path", "") for item in items),
                "action": "duplicate_review",
                "safety": "hypothesis_only_no_write",
            })

    sampler_rows = []
    for group, items in sampler_groups.items():
        sampler_rows.append({
            "group": group,
            "count": len(items),
            "total_size": sum(item.get("size", 0) for item in items),
            "example": items[0].get("relative_path", ""),
            "relationship": "HYPOTHESIS_ONLY",
        })

    suggestions = []
    if weak_rows and sampler_rows:
        for weak in weak_rows[:10]:
            suggestions.append({
                "target": weak["file"],
                "suggested_source": sampler_rows[0]["group"],
                "action_type": "replace_later",
                "confidence": "low",
                "reason": "weak candidate plus plausible sampler group",
                "safety": "hypothesis_only_no_write",
            })
    else:
        unknowns = [row for row in classifications if row["classification"] == "unknown_binary"]
        for row in unknowns[:8]:
            suggestions.append({
                "target": row["file"],
                "suggested_source": "manual review before replacement",
                "action_type": "review",
                "confidence": "low",
                "reason": "No confirmed empty slot detected; review weak/unknown file manually",
                "safety": "hypothesis_only_no_write",
            })
        style_rows = [row for row in classifications if row["classification"] == "likely_style_container"]
        for row in style_rows:
            suggestions.append({
                "target": row["file"],
                "suggested_source": "DSP first, replacement later",
                "action_type": "dsp_unify",
                "confidence": "medium",
                "reason": "style container is the largest/most useful review target",
                "safety": "hypothesis_only_no_write",
            })

    summary = {
        "files_analyzed": len(inventory),
        "set_structure_detected": "YES" if set_structure else "NO",
        "sampler_candidates": len(sampler_rows),
        "empty_weak_candidates": len(weak_rows),
        "duplicate_groups": len(duplicate_rows),
        "useful_suggestions": len(suggestions),
        "classification_counts": dict(Counter(row["classification"] for row in classifications)),
        "dsp_counts": dict(Counter(row["category"] for row in dsp_rows)),
        "v32_files": v32_summary.get("files_analyzed", len(inventory)),
        "read_only": "YES",
        "original_set_modified": "NO",
        "binary_writer": "NO",
        "sample_extraction": "NO",
        "relationship_policy": "HYPOTHESIS_ONLY unless confirmed by safe metadata",
    }

    write_json("V33_DEEP_SET_SUMMARY.json", summary)
    write_csv("V33_BANK_SLOT_GUESSES.csv", bank_rows, ["file", "bank_slot_guess", "confidence", "reason"])
    write_csv("V33_SOUND_STYLE_SAMPLE_CLASSIFICATION.csv", classifications, ["file", "extension", "size", "classification", "confidence", "relationship", "reason"])
    write_csv("V33_EMPTY_WEAK_CANDIDATES.csv", weak_rows, ["file", "reason", "confidence", "suggested_action", "safety"])
    write_csv("V33_DUPLICATE_GROUPS.csv", duplicate_rows, ["sha256", "count", "files", "action", "safety"])
    write_csv("V33_SAMPLER_GROUPS.csv", sampler_rows, ["group", "count", "total_size", "example", "relationship"])
    write_csv("V33_DSP_ASSIGNMENTS.csv", dsp_rows, ["file_or_group", "category", "suggested_chain", "confidence", "reason"])
    write_csv("V33_REPLACEMENT_SUGGESTIONS.csv", suggestions, ["target", "suggested_source", "action_type", "confidence", "reason", "safety"])

    ar = [
        "# ملخص V33 Deep SET Analyzer",
        "",
        f"هل وجدنا هيكل SET؟ {'نعم' if set_structure else 'لا'}",
        f"عدد الملفات: {len(inventory)}",
        f"مرشحات السامبلر: {len(sampler_rows)}",
        f"مرشحات الفارغ/الضعيف: {len(weak_rows)}",
        f"مجموعات التكرار: {len(duplicate_rows)}",
        f"اقتراحات مفيدة للمراجعة: {len(suggestions)}",
        "",
        "ما نوع الملفات؟",
    ]
    ar.extend([f"- {k}: {v}" for k, v in summary["classification_counts"].items()])
    ar.extend([
        "",
        "هل وجدنا سامبلر؟",
        "لم تظهر ملفات sample-like واضحة في V33 إذا كان العدد 0. هذا لا ينفي وجود علاقات داخلية داخل الملفات الثنائية.",
        "",
        "هل وجدنا فارغ؟",
        "تم تعليم الملفات الصغيرة أو غير الواضحة كمرشحات ضعيفة فقط، وليس كفراغ مؤكد.",
        "",
        "هل وجدنا تكرار؟",
        "التكرار يعتمد على sha256 فقط.",
        "",
        "لماذا الاقتراحات أصبحت أوضح؟",
        "لأن V33 يضيف قواعد مسار/امتداد/بنك/كلمات مفاتيح، لكنه لا يدعي parse كامل.",
        "",
        "ما الذي يحتاج تأكيد يدوي؟",
        "كل علاقة Sound/Sample وكل Slot/Program وكل ملف unknown_binary.",
        "",
        "لا يوجد تعديل للست.",
    ])
    (OUT / "V33_DEEP_SET_SUMMARY_AR.md").write_text("\n".join(ar), encoding="utf-8")

    manual = ["# V33 Manual Review Required", ""]
    for suggestion in suggestions:
        manual.append(f"- {suggestion['target']}: {suggestion['action_type']} / {suggestion['reason']}")
    (OUT / "V33_MANUAL_REVIEW_REQUIRED_AR.md").write_text("\n".join(manual), encoding="utf-8")
    print(json.dumps({"status": "PASS", **summary}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
