---
name: Auth token key alignment
description: All localStorage token reads must use "seen_access_token", not "seenstore_access_token"
---

The canonical token key is `seen_access_token` as defined in `frontend/src/lib/apiClient.ts` (`getToken()`).

**Why:** Two different key names were used historically — `seenstore_access_token` (wrong) and `seen_access_token` (correct). Using the wrong key means logged-in users' orders won't be linked to their accounts.

**How to apply:** Always use `localStorage.getItem("seen_access_token")` or better: import and call `getToken()` from `apiClient.ts` instead of reading localStorage directly.
