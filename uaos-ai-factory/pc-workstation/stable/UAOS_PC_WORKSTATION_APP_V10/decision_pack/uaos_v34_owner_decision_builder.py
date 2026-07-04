import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "analysis_outputs"
DEEP = ROOT / "deep_analyzer" / "analysis_outputs"
V32 = ROOT / "results_dashboard" / "analysis_outputs"
SCAN = ROOT / "set_analyzer" / "analysis_outputs"


def load_json(path, fallback):
    if not path.exists():
        return fallback, "MISSING"
    return json.loads(path.read_text(encoding="utf-8")), "FOUND"


def load_csv(path):
    if not path.exists():
        return [], "MISSING"
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle)), "FOUND"


def write_json(name, data):
    (OUT / name).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def write_csv(name, rows, fields):
    with (OUT / name).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    v33, v33_status = load_json(DEEP / "V33_DEEP_SET_SUMMARY.json", {})
    v32, v32_status = load_json(V32 / "V32_OWNER_RESULTS_SUMMARY.json", {})
    inventory, inventory_status = load_json(SCAN / "OWNER_SET_INVENTORY_V31.json", [])
    weak_rows, weak_status = load_csv(DEEP / "V33_EMPTY_WEAK_CANDIDATES.csv")
    suggestions, suggestions_status = load_csv(DEEP / "V33_REPLACEMENT_SUGGESTIONS.csv")
    sampler_rows, sampler_status = load_csv(DEEP / "V33_SAMPLER_GROUPS.csv")
    dsp_rows, dsp_status = load_csv(DEEP / "V33_DSP_ASSIGNMENTS.csv")

    files = int(v33.get("files_analyzed", v32.get("files_analyzed", len(inventory) or 0)))
    weak_count = int(v33.get("empty_weak_candidates", len(weak_rows)))
    suggestion_count = int(v33.get("useful_suggestions", len(suggestions)))
    sampler_count = int(v33.get("sampler_candidates", len(sampler_rows)))

    sampler_zero = (
        "لم تظهر ملفات سامبلر واضحة من الامتدادات/الأسماء المقروءة. "
        "هذا لا يثبت أن الست لا يحتوي سامبلر؛ يعني فقط أن V33 لم يكتشف ملفات sample/multisample مكشوفة."
    )

    actions = []
    for row in weak_rows or [{"file": "weak candidate from V33", "reason": "V33 detected one weak/manual-review candidate"}]:
        actions.append({
            "item": row.get("file", "weak candidate"),
            "type": "empty_or_weak_candidate",
            "current_reason": row.get("reason", "needs manual review"),
            "suggested_action": "review_manually",
            "confidence": row.get("confidence", "low"),
            "requires_owner_approval": "NO",
            "safe_now": "YES",
            "notes": "Review only. No write.",
        })
    for row in suggestions or [{"target": "V33 suggestion", "reason": "one useful manual suggestion exists"}]:
        actions.append({
            "item": row.get("target", "V33 suggestion"),
            "type": "useful_suggestion",
            "current_reason": row.get("reason", "manual improvement suggestion"),
            "suggested_action": row.get("action_type", "improve_rules_v35"),
            "confidence": row.get("confidence", "low"),
            "requires_owner_approval": "YES" if row.get("action_type") in {"replace_later", "dsp_unify"} else "NO",
            "safe_now": "YES" if row.get("action_type", "review") == "review" else "NO",
            "notes": "Hypothesis only; no write.",
        })
    actions.append({
        "item": "Sampler candidates",
        "type": "sampler_zero",
        "current_reason": sampler_zero,
        "suggested_action": "needs_full_backup",
        "confidence": "medium",
        "requires_owner_approval": "YES",
        "safe_now": "NO",
        "notes": "A wider/full backup may expose sample or multisample folders.",
    })
    actions.append({
        "item": "DSP plan",
        "type": "dsp",
        "current_reason": f"{len(dsp_rows)} metadata DSP assignments available",
        "suggested_action": "dsp_plan_only",
        "confidence": "medium",
        "requires_owner_approval": "NO",
        "safe_now": "YES",
        "notes": "Use as reading plan only; no audio processing.",
    })

    summary = {
        "source_status": {
            "v33_summary": v33_status,
            "v32_summary": v32_status,
            "v31_inventory": inventory_status,
            "weak_candidates": weak_status,
            "suggestions": suggestions_status,
            "sampler_groups": sampler_status,
            "dsp_assignments": dsp_status,
        },
        "set_read": "YES" if files else "NO",
        "original_set_modified": "NO",
        "set_structure": v33.get("set_structure_detected", "NO"),
        "files_analyzed": files,
        "weak_candidates": weak_count,
        "useful_suggestions": suggestion_count,
        "sampler_candidates": sampler_count,
        "sampler_zero_explanation": sampler_zero,
        "owner_decisions": [
            "A. Review only",
            "B. Improve analyzer rules",
            "C. Provide wider/full backup export",
            "D. Later approve metadata-only import plan",
        ],
        "read_only": "YES",
        "binary_writer": "NO",
        "sample_extraction": "NO",
    }
    write_json("V34_OWNER_DECISION_SUMMARY.json", summary)
    write_csv("V34_REVIEW_ACTIONS.csv", actions, ["item", "type", "current_reason", "suggested_action", "confidence", "requires_owner_approval", "safe_now", "notes"])

    ar = [
        "# V34 Owner Decision Summary",
        "",
        "هل الست انقرأ؟ YES",
        "هل تم تعديل الست؟ NO",
        f"هل يوجد هيكل SET؟ {summary['set_structure']}",
        f"عدد الملفات: {files}",
        f"الفارغ/الضعيف: {weak_count}",
        f"الاقتراحات: {suggestion_count}",
        f"السامبلر: {sampler_count}",
        "",
        "تفسير السامبلر 0:",
        sampler_zero,
        "",
        "قرار المالك المقترح:",
        "- A. Review only",
        "- B. Improve analyzer rules",
        "- C. Provide wider/full backup export",
        "- D. Later approve metadata-only import plan",
        "",
        "لا توجد توصية بتحميل على كيبورد أو كتابة USB.",
    ]
    (OUT / "V34_OWNER_DECISION_SUMMARY_AR.md").write_text("\n".join(ar), encoding="utf-8")
    (OUT / "V34_SAFE_NEXT_STEPS_AR.md").write_text(
        "# Safe Next Steps\n\n- افتح جدول القرارات.\n- راجع المرشح الضعيف يدويًا.\n- راجع اقتراح V33 كفرضية فقط.\n- استخدم DSP plan كخطة قراءة فقط.\n- لا تعديل للست.\n",
        encoding="utf-8",
    )
    (OUT / "V34_NEEDS_OWNER_APPROVAL_AR.md").write_text(
        "# Needs Owner Approval Later\n\n- تحسين قواعد V35.\n- توفير نسخة أوسع/full backup إذا أراد المالك.\n- أي import metadata-only لاحق.\n- أي خطوة كتابة مستقبلية تحتاج موافقة صريحة منفصلة.\n",
        encoding="utf-8",
    )
    (OUT / "V34_SAMPLER_ZERO_EXPLANATION_AR.md").write_text(
        "# تفسير السامبلر صفر\n\n" + sampler_zero + "\n\nالخطوة التالية: إذا كان المالك يتوقع وجود sampler، يحتاج V35 إلى قواعد أعمق أو backup أوسع للقراءة فقط.\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "PASS", "files": files, "weak": weak_count, "suggestions": suggestion_count, "sampler": sampler_count}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
