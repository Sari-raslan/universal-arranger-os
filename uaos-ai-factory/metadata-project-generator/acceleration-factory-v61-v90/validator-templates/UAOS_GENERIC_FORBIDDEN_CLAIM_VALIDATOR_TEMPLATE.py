AFFIRMATIVE_CLAIM_PATTERNS = [
    "export_allowed: " + "true",
    "real_owner_approval_applied: " + "true",
    "pass_claim_allowed: " + "true",
    "production_ready: " + "true",
    "deploy_enabled: " + "true",
    "payment_enabled: " + "true",
]


def find_forbidden_claims(text):
    lowered = text.lower()
    return [pattern for pattern in AFFIRMATIVE_CLAIM_PATTERNS if pattern in lowered]
