# Stop Rules And Limits

Status: local plan only

- Stop on rate limit.
- Stop on credit warning.
- Stop on serious FAIL.
- Stop if a task asks for push, deploy, payment, real writer, or real export.
- Stop if a task requires an external account that is not ready.
- Stop if a whole repo scan is requested.
- Stop if cost risk is HIGH without approval.
- Stop if the task is unclear enough that risk cannot be classified.
- Maximum builds per task: 1 unless approved.
- Maximum retries per task: 1 unless approved.
- Maximum concurrent agents: 1.
