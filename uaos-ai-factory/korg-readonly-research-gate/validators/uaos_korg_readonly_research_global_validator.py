from pathlib import Path
import json,re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'validators/UAOS_KORG_READONLY_RESEARCH_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
required=['v141_research_scope/UAOS_V141_KORG_READONLY_RESEARCH_SCOPE.md','v142_format_unknowns/UAOS_V142_KORG_FORMAT_UNKNOWNS_REGISTER.md','v143_fixture_policy/UAOS_V143_SAFE_FIXTURE_POLICY.md','v144_readonly_parser_design/UAOS_V144_READONLY_KORG_PARSER_DESIGN.md','v145_style_mapping_gap_analysis/UAOS_V145_UAOS_STYLE_TO_KORG_GAP_ANALYSIS.md','v146_writer_sandbox_blocked/UAOS_V146_KORG_WRITER_SANDBOX_BLOCKED.md','v147_risk_register/UAOS_V147_KORG_EXPORT_RISK_REGISTER.md','v148_owner_approval_gate/UAOS_V148_KORG_RESEARCH_OWNER_APPROVAL_GATE.md','v149_research_dashboard/UAOS_V149_KORG_READONLY_RESEARCH_DASHBOARD.html','v150_final_research_gate_seal/UAOS_V150_FINAL_SEAL.md']
for r in required: add('required output '+r,(BASE/r).exists(),r)
for p in ['v141_research_scope/UAOS_V141_RESEARCH_BOUNDARIES.json','v142_format_unknowns/UAOS_V142_KORG_FORMAT_UNKNOWNS_REGISTER.json','v148_owner_approval_gate/UAOS_V148_KORG_RESEARCH_APPROVAL_FORM.json']:
    try: json.loads((BASE/p).read_text(encoding='utf-8')); add('json parses '+p,True,p)
    except Exception as e: add('json parses '+p,False,str(e))
forbidden={'.set','.sty','.prf','.prs','.kst'}
# Note: docs may mention blocked extensions; this checks actual generated filenames.
patterns=[re.compile(r'writer_implemented"?\s*:\s*true|korg writer implemented:\s*yes|real_korg_writer_used"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|usb path:\s*[A-Z]:|copy to usb:\s*yes',re.I),re.compile(r'pa3x load:\s*yes|pa3x_load"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true|react integration:\s*yes|react_integration"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|compatibility_claim"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim"?\s*:\s*true',re.I)]
research_labels=0; writer_blocked=0
for f in BASE.rglob('*'):
    if f.is_file():
        add('forbidden output type '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore')
            if 'research only' in text.lower() or 'read-only research' in text.lower(): research_labels += 1
            if 'writer' in text.lower() and 'blocked' in text.lower(): writer_blocked += 1
            hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
add('research-only labels exist',research_labels>=3,str(research_labels))
add('writer remains blocked labels exist',writer_blocked>=3,str(writer_blocked))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
