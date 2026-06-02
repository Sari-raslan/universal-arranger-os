$Log = "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops\launch\overnight-agent-log.txt"

while ($true) {

    "===== HEARTBEAT $(Get-Date) =====" | Out-File $Log -Append -Encoding utf8

    try {

        cd "C:\Users\ssare\Documents\Codex\2026-06-02\github-plugin-github-openai-curated-inspe\uaos-media-ops"

        git status | Out-File $Log -Append

        if (Test-Path "ai-videos\make_demo_videos.py") {

            if (Test-Path "ai-videos\.venv\Scripts\python.exe") {

                .\ai-videos\.venv\Scripts\python.exe ai-videos\make_demo_videos.py | Out-File $Log -Append

            }

        }

        git add . | Out-File $Log -Append
        git commit -m "UAOS automated overnight update" | Out-File $Log -Append
        git push | Out-File $Log -Append

        "===== LOOP COMPLETE =====" | Out-File $Log -Append

    }
    catch {

        "ERROR: $($_.Exception.Message)" | Out-File $Log -Append

    }

    Start-Sleep -Seconds 300
}
