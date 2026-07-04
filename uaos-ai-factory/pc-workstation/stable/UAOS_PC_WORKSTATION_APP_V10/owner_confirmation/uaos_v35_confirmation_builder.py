import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "analysis_outputs"
DECISION = ROOT / "decision_pack" / "analysis_outputs"
DEEP = ROOT / "deep_analyzer" / "analysis_outputs"
SCAN = ROOT / "set_analyzer" / "analysis_outputs"

ALLOWED = [
    "confirm_sound",
    "confirm_style",
    "confirm_sample",
    "confirm_weak",
    "confirm_keep",
    "confirm_replace_later",
    "confirm_dsp_only",
    "unknown",
]


def load_csv(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_csv(path, rows, fields):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    actions = load_csv(DECISION / "V34_REVIEW_ACTIONS.csv")
    classifications = {row.get("file"): row for row in load_csv(DEEP / "V33_SOUND_STYLE_SAMPLE_CLASSIFICATION.csv")}
    dsp = {row.get("file_or_group"): row for row in load_csv(DEEP / "V33_DSP_ASSIGNMENTS.csv")}
    suggestions = {row.get("target"): row for row in load_csv(DEEP / "V33_REPLACEMENT_SUGGESTIONS.csv")}
    inventory = load_json(SCAN / "OWNER_SET_INVENTORY_V31.json", [])

    items = []
    source_rows = actions or [{"item": item.get("relative_path", ""), "type": "inventory_review", "current_reason": "inventory item", "confidence": "low", "suggested_action": "review_manually"} for item in inventory[:10]]
    for index, action in enumerate(source_rows, start=1):
        file_or_item = action.get("item", "")
        cls = classifications.get(file_or_item, {})
        dsp_row = dsp.get(file_or_item, {})
        suggestion = suggestions.get(file_or_item, {})
        current_guess = cls.get("classification") or action.get("type") or "manual_review"
        recommended = "confirm_weak" if "weak" in action.get("type", "") else "unknown"
        if action.get("suggested_action") == "dsp_plan_only":
            recommended = "confirm_dsp_only"
        if action.get("suggested_action") in {"replace_later", "improve_rules_v35"}:
            recommended = "confirm_replace_later"
        items.append({
            "id": f"V35-{index:03d}",
            "file_or_item": file_or_item,
            "current_guess": current_guess,
            "confidence": action.get("confidence") or cls.get("confidence") or "low",
            "reason": action.get("current_reason") or cls.get("reason") or "manual review required",
            "recommended_owner_choice": recommended,
            "allowed_choices": ALLOWED,
            "dsp_category_guess": dsp_row.get("category", "Unknown"),
            "replacement_suggestion": suggestion.get("suggested_source", action.get("suggested_action", "review_manually")),
            "safety_status": "metadata_only_no_set_write",
        })

    template = {
        "format": "UAOS_OWNER_CONFIRMATIONS_V35",
        "instructions": "Owner can export confirmations from the UI and place them here manually later.",
        "items": [
            {"id": item["id"], "file_or_item": item["file_or_item"], "owner_choice": "unknown", "owner_note": ""}
            for item in items
        ],
        "safety": {
            "metadata_only": True,
            "original_set_modified": False,
            "binary_writer": False,
            "sample_extraction": False,
        },
    }

    (OUT / "V35_CONFIRMATION_ITEMS.json").write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")
    write_csv(OUT / "V35_CONFIRMATION_ITEMS.csv", items, ["id", "file_or_item", "current_guess", "confidence", "reason", "recommended_owner_choice", "dsp_category_guess", "replacement_suggestion", "safety_status"])
    (OUT / "V35_CONFIRMED_METADATA_TEMPLATE.json").write_text(json.dumps(template, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT / "V35_OWNER_CONFIRMATION_GUIDE_AR.md").write_text(
        "# دليل تأكيد المالك V35\n\n"
        "افتح واجهة V35، اختر كل عنصر، ثم اختر القرار المناسب. الحفظ داخل المتصفح localStorage فقط. استخدم Export لإخراج UAOS_OWNER_CONFIRMATIONS_V35.json.\n\n"
        "الخيارات: confirm_sound, confirm_style, confirm_sample, confirm_weak, confirm_keep, confirm_replace_later, confirm_dsp_only, unknown.\n\n"
        "لا يوجد تعديل للست الأصلي.\n",
        encoding="utf-8",
    )
    (OUT / "V35_RECOMMENDATION_UPGRADE_PLAN_AR.md").write_text(
        "# خطة تحسين التوصيات بعد تأكيد المالك\n\n"
        "- مع تأكيدات المالك، يستطيع V36 ترتيب توصيات أدق.\n"
        "- إذا أكد المالك العنصر الضعيف، يمكن V36 اقتراح DSP أو replacement plan.\n"
        "- إذا أكد المالك عدم وجود sampler، يركز V36 على style/sound metadata.\n"
        "- إذا وفر المالك full backup فيه PCM/KMP/KSF، يمكن للمحلل اكتشاف sampler groups.\n"
        "- لا يوجد writer ولا تحميل PA3X في هذه المرحلة.\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "PASS", "items": len(items)}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
