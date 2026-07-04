import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "analysis_outputs"
OWNER = ROOT / "owner_confirmation" / "analysis_outputs"
DEEP = ROOT / "deep_analyzer" / "analysis_outputs"
DECISION = ROOT / "decision_pack" / "analysis_outputs"
SCAN = ROOT / "set_analyzer" / "analysis_outputs"

CANONICAL_CHOICES = {
    "NEWNAME.SET\\GLOBAL\\MXPRESET.MXP": "confirm_weak",
    "NEWNAME.SET\\STYLE\\USER01.STY": "confirm_style",
    "Sampler candidates": "unknown",
    "DSP plan": "confirm_dsp_only",
}


def load_json(path, fallback):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path, rows, fieldnames):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def owner_choices():
    export_path = OWNER / "UAOS_OWNER_CONFIRMATIONS_V35.json"
    items_path = OWNER / "V35_CONFIRMATION_ITEMS.json"
    fallback_used = False
    warnings = []
    exported = {}
    if export_path.exists():
        data = load_json(export_path, {})
        for item in data.get("items", []):
            choice = item.get("owner_confirmation", {}).get("choice")
            if item.get("file_or_item") and choice:
                exported[item["file_or_item"]] = choice
    else:
        fallback_used = True
        warnings.append("V35 export missing; used run-brief confirmed choices.")

    if exported:
        for target, canonical in CANONICAL_CHOICES.items():
            if exported.get(target) and exported[target] != canonical:
                warnings.append(f"V35 export mismatch for {target}; used run-brief confirmed choice {canonical}.")
    items = load_json(items_path, [])
    item_lookup = {item.get("file_or_item"): item for item in items}
    confirmed = []
    for target, choice in CANONICAL_CHOICES.items():
        base = item_lookup.get(target, {"file_or_item": target, "confidence": "medium"})
        confirmed.append({
            "item": target,
            "owner_choice": choice,
            "confidence": base.get("confidence", "medium"),
            "dsp_category_guess": base.get("dsp_category_guess", "Unknown"),
            "reason": base.get("reason", "confirmed by owner workflow"),
        })
    return confirmed, fallback_used, warnings


def build_action_plan(confirmed):
    rows = []
    for row in confirmed:
        item = row["item"]
        choice = row["owner_choice"]
        if choice == "confirm_weak":
            rows.append({
                "item": item,
                "owner_choice": choice,
                "confirmed_type": "weak_global_metadata_candidate",
                "safe_action_now": "review metadata role and mark as weak/global metadata candidate",
                "blocked_action": "write, replace, or map into keyboard format",
                "confidence": "medium",
                "next_step": "backup completeness check and safe format mapping research",
                "output_metadata_key": "weak_global_metadata_candidate",
            })
        elif choice == "confirm_style":
            rows.append({
                "item": item,
                "owner_choice": choice,
                "confirmed_type": "style_source",
                "safe_action_now": "classify as style source and create style metadata tags",
                "blocked_action": "direct style editing",
                "confidence": "high",
                "next_step": "style review JSON in V37 metadata project",
                "output_metadata_key": "style_source_user01",
            })
        elif item == "Sampler candidates":
            rows.append({
                "item": item,
                "owner_choice": choice,
                "confirmed_type": "sampler_unknown",
                "safe_action_now": "explain not detected and request wider backup if available",
                "blocked_action": "sample extraction",
                "confidence": "medium",
                "next_step": "full backup completeness check for PCM/KMP/KSF if owner provides it",
                "output_metadata_key": "sampler_presence_unknown",
            })
        elif choice == "confirm_dsp_only":
            rows.append({
                "item": item,
                "owner_choice": choice,
                "confirmed_type": "dsp_only_plan",
                "safe_action_now": "create category-based DSP metadata plan",
                "blocked_action": "assigning DSP to keyboard data",
                "confidence": "medium",
                "next_step": "DSP plan JSON in V37 metadata project",
                "output_metadata_key": "dsp_metadata_plan",
            })
    return rows


def build_dsp_plan():
    return [
        {"chain": "Global safe chain", "category": "Global/Utility", "safe_use": "neutral metadata chain for global or unclear files", "assignment_rule": "do not assign to keyboard data"},
        {"chain": "Style playback chain", "category": "Drums/Style", "safe_use": "style playback review hints for USER01 style source", "assignment_rule": "owner review before future simulator use"},
        {"chain": "Unknown source neutral chain", "category": "Unknown", "safe_use": "light neutral chain for unknown metadata rows", "assignment_rule": "metadata only"},
        {"chain": "Arabic strings chain", "category": "Future preset", "safe_use": "future UI/player preset idea only", "assignment_rule": "not assigned unless confirmed"},
    ]


def build_style_plan():
    return [{
        "style_item": "NEWNAME.SET\\STYLE\\USER01.STY",
        "style_bank": "USER01",
        "style_type": "owner_style",
        "review_needed": "YES",
        "dsp_dependency": "style tracks unknown",
        "safe_action": "metadata tags only",
        "blocked_action": "direct editing",
    }]


def build_weak_plan():
    return [{
        "weak_item": "NEWNAME.SET\\GLOBAL\\MXPRESET.MXP",
        "confirmed_type": "weak_global_metadata_candidate",
        "safe_action": "review metadata role",
        "blocked_action": "write or replace",
        "next_step": "backup completeness check",
    }]


def write_reports(summary, action_plan, dsp_plan, style_plan, weak_plan):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "V36_CONFIRMED_RECOMMENDATION_SUMMARY.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    write_csv(OUT / "V36_CONFIRMED_ACTION_PLAN.csv", action_plan, ["item", "owner_choice", "confirmed_type", "safe_action_now", "blocked_action", "confidence", "next_step", "output_metadata_key"])
    write_csv(OUT / "V36_DSP_ACTION_PLAN.csv", dsp_plan, ["chain", "category", "safe_use", "assignment_rule"])
    write_csv(OUT / "V36_STYLE_REVIEW_PLAN.csv", style_plan, ["style_item", "style_bank", "style_type", "review_needed", "dsp_dependency", "safe_action", "blocked_action"])
    write_csv(OUT / "V36_WEAK_ITEM_PLAN.csv", weak_plan, ["weak_item", "confirmed_type", "safe_action", "blocked_action", "next_step"])
    (OUT / "V36_CONFIRMED_RECOMMENDATION_SUMMARY_AR.md").write_text(
        "# ملخص توصيات V36 المؤكدة\n\n"
        "- العناصر المؤكدة: 4\n"
        "- عنصر ضعيف مؤكد: 1\n"
        "- ستايل مؤكد: 1\n"
        "- السامبلر غير معروف: 1\n"
        "- DSP فقط: 1\n\n"
        "هذه الخطة لا تعدل ملف SET الأصلي، ولا تكتب بيانات كيبورد، ولا تستخرج عينات. العمل هنا ترتيب ميتاداتا وخطة مراجعة داخل UAOS فقط.\n\n"
        "## ما يمكن تحسينه الآن\n\n"
        "- تمييز MXPRESET.MXP كمرشح global/weak يحتاج مراجعة.\n"
        "- تصنيف USER01.STY كمصدر ستايل وربطه بخطة مراجعة ستايل.\n"
        "- إبقاء السامبلر في حالة غير معروف حتى تتوفر نسخة أوسع إن وجدت.\n"
        "- تحويل DSP إلى خطة فئات آمنة لا تغير بيانات الكيبورد.\n\n"
        "## ما لا يمكن فعله الآن\n\n"
        "- لا تعديل مباشر على SET.\n"
        "- لا استبدال ملفات.\n"
        "- لا استخراج عينات.\n"
        "- لا ادعاء توافق أو جاهزية للكيبورد.\n",
        encoding="utf-8",
    )
    (OUT / "V36_SAMPLER_UNKNOWN_PLAN_AR.md").write_text(
        "# خطة السامبلر غير المعروف\n\n"
        "لم يتم تأكيد وجود السامبلر ولم يتم نفيه. عدم اكتشاف ملفات sample/multisample مكشوفة لا يعني أن الست لا يحتوي عينات.\n\n"
        "الخطوة الآمنة: طلب backup أوسع أو كامل إذا كان متاحًا ويحتوي PCM/KMP/KSF. لا توجد أي عملية استخراج عينات في V36.\n",
        encoding="utf-8",
    )
    (OUT / "V36_NEXT_PRODUCT_STEP_AR.md").write_text(
        "# الخطوة التالية المقترحة\n\n"
        "V37 المقترح: UAOS Metadata Project Generator\n\n"
        "ينشئ مشروع ميتاداتا داخلي لـ UAOS من اختيارات المالك المؤكدة:\n\n"
        "- لا كتابة KORG.\n"
        "- لا تعديل SET.\n"
        "- يمكن إنشاء ملف .uaosproject JSON داخلي.\n"
        "- يمكن إنشاء DSP plan JSON.\n"
        "- يمكن إنشاء style review JSON.\n"
        "- يمكن استخدامه لاحقًا في UI أو player أو writer simulator.\n",
        encoding="utf-8",
    )


def main():
    confirmed, fallback_used, warnings = owner_choices()
    action_plan = build_action_plan(confirmed)
    dsp_plan = build_dsp_plan()
    style_plan = build_style_plan()
    weak_plan = build_weak_plan()

    summary = {
        "status": "PASS_WITH_WARNINGS" if warnings or fallback_used else "PASS",
        "base_state": "V35 PASS, 4 owner confirmations",
        "fallback_used": fallback_used,
        "warnings": warnings,
        "confirmed_items": len(confirmed),
        "weak_confirmed": 1,
        "style_confirmed": 1,
        "sampler_unknown": 1,
        "dsp_only": 1,
        "inputs_read": {
            "owner_export": (OWNER / "UAOS_OWNER_CONFIRMATIONS_V35.json").exists(),
            "v35_items": (OWNER / "V35_CONFIRMATION_ITEMS.json").exists(),
            "v34_review_actions": (DECISION / "V34_REVIEW_ACTIONS.csv").exists(),
            "v33_dsp": (DEEP / "V33_DSP_ASSIGNMENTS.csv").exists(),
            "v33_suggestions": (DEEP / "V33_REPLACEMENT_SUGGESTIONS.csv").exists(),
            "v33_classification": (DEEP / "V33_SOUND_STYLE_SAMPLE_CLASSIFICATION.csv").exists(),
            "v31_inventory": (SCAN / "OWNER_SET_INVENTORY_V31.json").exists(),
        },
        "confirmed_choices": confirmed,
        "safety": {
            "read_only": True,
            "original_set_modified": False,
            "usb_write": False,
            "pa3x_load": False,
            "binary_writer": False,
            "sample_extraction": False,
            "compatibility_claim": False,
            "keyboard_ready_claim": False,
            "deploy_payment": False,
        },
    }
    write_reports(summary, action_plan, dsp_plan, style_plan, weak_plan)
    print(json.dumps({"status": summary["status"], "confirmed_items": len(confirmed), "warnings": warnings}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
