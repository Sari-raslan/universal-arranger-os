# UAOS Aider Usage Policy

Aider is not removed from UAOS development.

It is currently restricted from broad automatic writes because a previous run:

- replaced the root package manifest with the frontend manifest;
- installed a placeholder failing test script;
- produced edit-format failures;
- left an idle process after stopping.

Approved use:

1. Work only on a non-master branch.
2. Give Aider one small file-scoped task.
3. Back up targeted files first.
4. Never let it rewrite root manifests without an explicit diff review.
5. Run `npm test`, `npm run check`, `npm run build`,
   `npm run runtime:check`, and `npm run desktop:smoke` after every write.
6. Use Aider primarily for review and suggestions until it demonstrates
   reliable edit-format compliance.

The IDE remains part of the workflow. This policy limits only unsafe autonomous writes.

NOT MERGED / NOT DEPLOYED