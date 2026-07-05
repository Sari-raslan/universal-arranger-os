from pathlib import Path
import json,re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'06_validators/UAOS_SUPER_AGENT_LAUNCHER_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
launcher=['00_launcher/RUN_UAOS_SUPER_AGENT_PREWRITER_V151_V200.cmd','00_launcher/UAOS_SUPER_AGENT_LAUNCHER_README.md','00_launcher/UAOS_SUPER_AGENT_LAUNCHER_CONFIG.json','00_launcher/UAOS_SUPER_AGENT_EXECUTION_ORDER.md']
for r in launcher: add('launcher file '+r,(BASE/r).exists(),r)
for i in range(1,11): add('agent definition '+str(i), len(list((BASE/'01_agents').glob(f'AGENT_{i:02d}_*.md')))==1, str(i))
for d in ['agent_01_korg_readonly_parser','agent_02_fixture_policy','agent_03_style_rc','agent_04_style_midi_sync','agent_05_validators','agent_06_dashboards','agent_07_external_review','agent_08_integrator','agent_09_safety','agent_10_roadmap']:
    add('agent output folder '+d,(BASE/'02_agent_outputs'/d).exists(),d)
for v in range(151,201):
    md=BASE/'03_draft_pipeline'/f'UAOS_V{v}_DRAFT_PLAN.md'; js=BASE/'03_draft_pipeline'/f'UAOS_V{v}_DRAFT_PLAN.json'
    add('draft plan exists V'+str(v),md.exists() and js.exists(),str(v))
    if js.exists():
        try:
            data=json.loads(js.read_text(encoding='utf-8'))
            add('draft status V'+str(v),data.get('status')=='DRAFT_NOT_RUN',data.get('status',''))
            add('draft pass false V'+str(v),data.get('pass_claim_allowed') is False,str(data.get('pass_claim_allowed')))
        except Exception as e: add('draft json parses V'+str(v),False,str(e))
for name in ['UAOS_BATCH_V151_V160_READONLY_PARSER_BLUEPRINT.md','UAOS_BATCH_V161_V170_FIXTURE_RESEARCH_BLUEPRINT.md','UAOS_BATCH_V171_V180_STYLE_RC_EXPANSION_BLUEPRINT.md','UAOS_BATCH_V181_V190_WRITER_SANDBOX_DESIGN_BLOCKED_BLUEPRINT.md','UAOS_BATCH_V191_V200_FINAL_INTEGRATION_BLUEPRINT.md']:
    add('blueprint exists '+name,(BASE/'05_batch_blueprints'/name).exists(),name)
for r in ['04_integrator_queue/UAOS_INTEGRATOR_QUEUE_V151_V200.json','04_integrator_queue/UAOS_INTEGRATOR_QUEUE_V151_V200.md','04_integrator_queue/UAOS_FAST_EXECUTION_STRATEGY.md','04_integrator_queue/UAOS_AGENT_TO_INTEGRATOR_HANDOFF_MAP.json']:
    add('integrator queue exists '+r,(BASE/r).exists(),r)
forbidden={'.set','.sty','.prf','.prs','.kst'}
patterns=[re.compile(r'korg writer implemented:\s*yes|writer_implemented"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_allowed"?\s*:\s*true|usb path:\s*[A-Z]:|copy to usb:\s*yes',re.I),re.compile(r'pa3x load:\s*yes|pa3x_load_allowed"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true|react integration:\s*yes|react_integration"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|compatibility_claim_allowed"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim_allowed"?\s*:\s*true',re.I)]
for f in BASE.rglob('*'):
    if f.is_file():
        add('forbidden extension '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py','.cmd'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore')
            hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
