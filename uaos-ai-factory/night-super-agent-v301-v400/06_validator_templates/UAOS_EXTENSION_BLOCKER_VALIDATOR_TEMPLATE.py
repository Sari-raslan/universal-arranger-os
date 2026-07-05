BLOCKED_EXTENSIONS = ['.sty','.set','.prs','.prf','.kst']
def is_blocked(name):
    return any(name.lower().endswith(ext) for ext in BLOCKED_EXTENSIONS)
