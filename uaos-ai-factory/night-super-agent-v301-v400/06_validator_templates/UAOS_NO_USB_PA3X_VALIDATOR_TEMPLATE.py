BLOCKED_DESTINATIONS = ['usb', 'removable', 'pa3x']
def safe_path(path):
    lower = str(path).lower()
    return not any(item in lower for item in BLOCKED_DESTINATIONS)
