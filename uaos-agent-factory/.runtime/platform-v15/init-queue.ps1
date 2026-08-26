$ErrorActionPreference='Continue'
$q='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v15\queue'
New-Item -ItemType Directory -Force -Path $q | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))}
$now=(Get-Date).ToUniversalTime().ToString('o')
$agents=@(
  @{id='cursor-commander';role='Cursor Commander';worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution';pid=$PID;status='IMPLEMENTING'}
  @{id='repo-integrity';role='Repository Integrity Agent';worktree='n/a-readonly-scan';status='READY'}
  @{id='library-adoption';role='Library Adoption Agent';worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\library-factory-8a149267';status='CLAIMED'}
  @{id='keyboard-adoption';role='Keyboard Adoption Agent';worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\keyboard-pro-415db512';status='CLAIMED'}
  @{id='creator-foundation';role='Creator Foundation Agent';worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\creator-shell-foundation';status='CLAIMED'}
  @{id='studio-project';role='Studio Project System Agent';worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\studio-phase1-project-system';status='CLAIMED'}
  @{id='test-agent';role='Test Agent';worktree='platform-v15-execution';status='READY'}
  @{id='review-agent';role='Review Agent';worktree='platform-v15-execution';status='READY'}
  @{id='evidence-agent';role='Evidence Agent';worktree='platform-v15-execution';status='READY'}
)
W $agents (Join-Path $q 'agents.json')
W @{
  tasks=@(
    @{id='T-LIB';lane='Library';status='IMPLEMENTING';dependsOn=@()}
    @{id='T-KBD';lane='Keyboard';status='IMPLEMENTING';dependsOn=@()}
    @{id='T-CRE';lane='Creator';status='IMPLEMENTING';dependsOn=@()}
    @{id='T-STU';lane='Studio';status='IMPLEMENTING';dependsOn=@()}
    @{id='T-KIDS';lane='Kids';status='OWNER_REQUIRED'}
    @{id='T-TEEN';lane='Teen';status='OWNER_REQUIRED'}
    @{id='T-PRICE';lane='Pricing';status='OWNER_REQUIRED'}
  )
} (Join-Path $q 'tasks.json')
W @{claims=@(
  @{task='T-LIB';agent='library-adoption';at=$now}
  @{task='T-KBD';agent='keyboard-adoption';at=$now}
  @{task='T-CRE';agent='creator-foundation';at=$now}
  @{task='T-STU';agent='studio-project';at=$now}
)} (Join-Path $q 'claims.json')
W @{locks=@(
  @{resource='original-repos';mode='readonly';holder='repo-integrity'}
  @{resource='library-wt';holder='library-adoption'}
  @{resource='keyboard-wt';holder='keyboard-adoption'}
  @{resource='creator-wt';holder='creator-foundation'}
  @{resource='studio-wt';holder='studio-project'}
)} (Join-Path $q 'locks.json')
W @{leases=@(
  @{agent='library-adoption';ttlSec=7200;renewedAt=$now}
  @{agent='keyboard-adoption';ttlSec=7200;renewedAt=$now}
  @{agent='creator-foundation';ttlSec=7200;renewedAt=$now}
  @{agent='studio-project';ttlSec=7200;renewedAt=$now}
)} (Join-Path $q 'leases.json')
W @{heartbeats=@(@{agent='cursor-commander';at=$now;pid=$PID})} (Join-Path $q 'heartbeats.json')
W @{ownership=@(
  @{path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\library-factory-8a149267';owner='library-adoption'}
  @{path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\keyboard-pro-415db512';owner='keyboard-adoption'}
  @{path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\creator-shell-foundation';owner='creator-foundation'}
  @{path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\studio-phase1-project-system';owner='studio-project'}
)} (Join-Path $q 'ownership.json')
$deps = [ordered]@{
  'T-LIB' = @()
  'T-KBD' = @()
  'T-CRE' = @()
  'T-STU' = @('phase0-contracts')
  'T-EVID' = @('T-LIB','T-KBD','T-CRE','T-STU')
}
W @{dependencies=$deps} (Join-Path $q 'dependencies.json')
W @{results=@()} (Join-Path $q 'results.json')
W @{phase='IMPLEMENTING';startedAt=$now;host='BOSS';mode='CURSOR_LOCAL_AGENT'} (Join-Path $q 'execution-state.json')
Write-Output 'QUEUE_READY'
