from pathlib import Path

ALLOWED_EXTENSIONS = (".uaoswriter-sandbox.json", ".uaoswriter-report.md", ".uaos-dummybin")
FORBIDDEN_EXTENSIONS = (".sty", ".set", ".prs", ".prf", ".kst")
MARKER = "NOT_KORG_OUTPUT_DO_NOT_LOAD"

class SandboxSafetyError(ValueError):
    pass

def is_usb_or_hardware_path(path: Path) -> bool:
    text = str(path).lower()
    return any(token in text for token in ("usb", "removable", "thumbdrive", "pa3x"))

def assert_safe_output_path(path: Path) -> None:
    suffix_text = path.name.lower()
    if any(suffix_text.endswith(ext) for ext in FORBIDDEN_EXTENSIONS):
        raise SandboxSafetyError(f"Forbidden keyboard output extension blocked: {path.name}")
    if not any(suffix_text.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise SandboxSafetyError(f"Output extension is not allowed for dummy sandbox: {path.name}")
    if is_usb_or_hardware_path(path):
        raise SandboxSafetyError("USB/PA3X-like output paths are blocked")

def marker_payload(label: str) -> str:
    return f"{MARKER}\nUAOS_DUMMY_SANDBOX_ONLY\n{label}\nNOT_KEYBOARD_LOADABLE\n"
