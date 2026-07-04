import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "analysis_outputs"
SCAN = ROOT / "set_analyzer" / "analysis_outputs"
DSP = ROOT / "dsp_planner" / "analysis_outputs"
REPL = ROOT / "replacement_engine" / "analysis_outputs"


def load_json(path, fallback):
    if not path.exists():
        return fallback, "MISSING"
    return json.loads(path.read_text(encoding="utf-8")), "FOUND"


def load_text(path):
    if not path.exists():
        return "MISSING"
    return path.read_text(encoding="utf-8", errors="ignore")


def write_json(name, payload):
    (OUT / name).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def write_csv(name, rows, columns):
    with (OUT / name).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in columns})


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    inventory, inventory_status = load_json(SCAN / "OWNER_SET_INVENTORY_V31.json", [])
    empty, empty_status = load_json(SCAN / "EMPTY_SLOT_CANDIDATES_V31.json", [])
    duplicates, duplicate_status = load_json(SCAN / "DUPLICATE_CANDIDATES_V31.json", [])
    sampler, sampler_status = load_json(SCAN / "SAMPLER_FILE_CANDIDATES_V31.json", [])
    used_unused, used_status = load_json(SCAN / "USED_UNUSED_HYPOTHESIS_V31.json", {})
    dsp_plan, dsp_status = load_json(DSP / "DSP_UNIFICATION_PLAN_V31.json", {})
    suggestions, suggestions_status = load_json(REPL / "REPLACEMENT_SUGGESTIONS_V31.json", [])
    fill_plan, fill_status = load_json(REPL / "EMPTY_SLOT_FILL_PLAN_V31.json", {})
    manual_review = load_text(REPL / "MANUAL_REVIEW_REQUIRED_V31.md")

    ext_counts = Counter(item.get("extension") or "(none)" for item in inventory)
    category_counts = Counter(item.get("category_guess", "unknown") for item in inventory)
    confidence_counts = Counter(item.get("relationship", "UNKNOWN") for item in inventory)
    top_largest = sorted(inventory, key=lambda item: item.get("size", 0), reverse=True)[:10]
    unknown_count = category_counts.get("possible_unknown_binary", 0)

    file_table = [
        {
            "relative_path": item.get("relative_path", ""),
            "extension": item.get("extension", ""),
            "size": item.get("size", 0),
            "category_guess": item.get("category_guess", ""),
            "confidence": item.get("confidence", ""),
            "relationship": item.get("relationship", "UNKNOWN"),
        }
        for item in inventory
    ]
    manual_rows = []
    for item in inventory:
        if item.get("relationship") != "CONFIRMED" or item.get("category_guess") == "possible_unknown_binary":
            manual_rows.append({
                "item": item.get("relative_path", ""),
                "reason": "relationship not confirmed" if item.get("category_guess") != "possible_unknown_binary" else "unknown binary category",
                "next_check": "V33 deeper extension and bank-slot heuristics",
                "status": item.get("relationship", "UNKNOWN"),
            })
    for item in empty:
        manual_rows.append({
            "item": item.get("slot_or_file", ""),
            "reason": item.get("reason", "empty candidate"),
            "next_check": "owner manual confirmation",
            "status": "HYPOTHESIS",
        })

    summary = {
        "source_status": {
            "inventory": inventory_status,
            "empty": empty_status,
            "duplicates": duplicate_status,
            "sampler": sampler_status,
            "used_unused": used_status,
            "dsp_plan": dsp_status,
            "suggestions": suggestions_status,
            "fill_plan": fill_status,
        },
        "set_read": "PASS" if inventory else "WAITING_OR_EMPTY",
        "files_analyzed": len(inventory),
        "suggestions_found": len(suggestions),
        "extension_counts": dict(ext_counts),
        "category_counts": dict(category_counts),
        "top_largest_files": top_largest,
        "duplicates_count": len(duplicates),
        "empty_candidates_count": len(empty),
        "sampler_candidates_count": len(sampler),
        "unknown_binaries_count": unknown_count,
        "confidence_summary": {
            "CONFIRMED": confidence_counts.get("CONFIRMED", 0),
            "HYPOTHESIS": confidence_counts.get("HYPOTHESIS", 0),
            "UNKNOWN": confidence_counts.get("UNKNOWN", 0),
        },
        "replacement_explanation": "Replacement suggestions are 0 because V31 has no confirmed Sound/Sample reference mapping and no confident empty-slot-to-category match yet.",
        "read_only": "YES",
        "original_set_modified": "NO",
        "manual_review_count": len(manual_rows),
    }

    write_json("V32_OWNER_RESULTS_SUMMARY.json", summary)
    write_csv("V32_FILE_CATEGORY_TABLE.csv", file_table, ["relative_path", "extension", "size", "category_guess", "confidence", "relationship"])
    write_csv("V32_MANUAL_REVIEW_TABLE.csv", manual_rows, ["item", "reason", "next_check", "status"])

    ar_lines = [
        "# ملخص نتائج تحليل SET - V32",
        "",
        "## هل الست انقرأ؟",
        "نعم، تم قراءة metadata من ملفات الست." if inventory else "لم تظهر ملفات بعد.",
        "",
        f"## كم ملف وجدنا؟\n{len(inventory)}",
        "",
        f"## هل في سامبلر؟\nعدد مرشحات السامبلر: {len(sampler)}. هذا HEURISTIC وليس تأكيد علاقة داخلية.",
        "",
        f"## هل في ملفات فارغة؟\nعدد المرشحين: {len(empty)}.",
        "",
        f"## هل في مكرر؟\nعدد مجموعات التكرار: {len(duplicates)}.",
        "",
        "## لماذا لم تظهر اقتراحات؟",
        "الاقتراحات = 0 لأن هذه المرحلة تقرأ metadata فقط، لذلك العلاقات بين Sound/Sample قد تكون غير مؤكدة.",
        "",
        "## ما الخطوة التالية؟",
        "V33 يحتاج قواعد أعمق للامتدادات والبنوك والسلوتات وفرضيات ربط السامبلر، مع تأكيد يدوي من المالك.",
        "",
        "## ما خطة DSP الحالية؟",
        "الخطة الحالية METADATA_ONLY: تنظيم الفئات واقتراح سلاسل DSP آمنة بدون معالجة صوت أو تعديل SET.",
        "",
        "## هل تم تعديل الست؟",
        "NO. لم يتم تعديل الست الأصلي.",
    ]
    (OUT / "V32_OWNER_RESULTS_SUMMARY_AR.md").write_text("\n".join(ar_lines), encoding="utf-8")

    next_rules = [
        "# V32 Next Analyzer Rules - V33 Plan",
        "",
        "- deeper extension mapping",
        "- KORG SET folder pattern detection",
        "- PCG/PRG/STY/KMP/KSF/PCM metadata heuristics",
        "- bank/slot naming heuristic",
        "- empty slot inference",
        "- sampler reference hypothesis",
        "- owner manual confirmation workflow",
        "- still no binary writer",
    ]
    (OUT / "V32_NEXT_ANALYZER_RULES.md").write_text("\n".join(next_rules), encoding="utf-8")

    dsp_lines = ["# ملخص خطة DSP - V32", "", "Mode: METADATA_ONLY", ""]
    for category, chain in (dsp_plan.get("chains") or {}).items():
        dsp_lines.append(f"## {category}")
        dsp_lines.extend([f"- {step}" for step in chain])
        dsp_lines.append("")
    (OUT / "V32_DSP_SUMMARY_AR.md").write_text("\n".join(dsp_lines), encoding="utf-8")

    repl_lines = [
        "# لماذا لا توجد اقتراحات تبديل؟",
        "",
        f"عدد الاقتراحات الحالي: {len(suggestions)}",
        "",
        "السبب: V31 يملك inventory وهاشات وتصنيفات عامة، لكنه لا يملك parser يؤكد علاقة Sound -> Sample أو Slot -> Program.",
        "لذلك أي تبديل حقيقي يحتاج V33 بقواعد أعمق وتأكيد يدوي، بدون كتابة داخل SET.",
        "",
        "Manual review source:",
        manual_review[:2000],
    ]
    (OUT / "V32_REPLACEMENT_EXPLANATION_AR.md").write_text("\n".join(repl_lines), encoding="utf-8")

    print(json.dumps({"status": "PASS", "files": len(inventory), "suggestions": len(suggestions), "outputs": str(OUT)}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
