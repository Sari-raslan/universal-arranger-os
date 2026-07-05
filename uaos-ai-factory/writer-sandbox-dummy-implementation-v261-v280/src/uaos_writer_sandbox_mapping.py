def build_dummy_mapping(style_source: str) -> dict:
    sections = ["intro", "variation_a", "variation_b", "variation_c", "variation_d", "fill", "break", "ending"]
    tracks = ["drums", "percussion", "bass", "chord", "pad", "phrase", "melody_guide"]
    return {
        "source": style_source,
        "mapping_status": "UNKNOWN/UNCONFIRMED/HYPOTHESIS",
        "section_blocks": [{"section": name, "dummy_block": f"dummy_section_{i:02d}", "claim": "HYPOTHESIS"} for i, name in enumerate(sections, 1)],
        "track_blocks": [{"track_role": name, "dummy_block": f"dummy_track_{i:02d}", "claim": "HYPOTHESIS"} for i, name in enumerate(tracks, 1)],
        "real_format_mapping_solved": False,
    }
