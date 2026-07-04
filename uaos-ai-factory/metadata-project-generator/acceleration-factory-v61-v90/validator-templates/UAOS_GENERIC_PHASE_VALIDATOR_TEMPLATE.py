def validate_phase_record(record):
    return record.get("status") == "DRAFT_NOT_RUN" and record.get("pass_claim_allowed") is False
