$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process (Join-Path $here "..\04_final_owner_setup_v5\UAOS_FINAL_OWNER_SETUP_V5_HOME.html")
Start-Process (Join-Path $here "..\08_dashboards\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_DASHBOARD.html")
