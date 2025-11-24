---
description: How to revert to a previous version of the code
---

If you encounter errors and need to go back to a previous working version, you can use `git` to revert changes.

### Option 1: Revert the last commit (Undo the most recent changes)

This will create a *new* commit that does the exact opposite of the last commit, effectively undoing it while keeping the history.

```bash
git revert HEAD
git push origin main
```

### Option 2: Reset to a specific point in time (Hard Reset)

**WARNING:** This will completely erase any changes made after the specified commit. Use this only if you are sure you want to discard recent work.

1.  **Find the commit hash** you want to go back to:
    ```bash
    git log --oneline
    ```
    (Press `q` to exit the log view)

2.  **Reset the code** to that commit (replace `COMMIT_HASH` with the actual code, e.g., `c0a3ec1`):
    ```bash
    git reset --hard COMMIT_HASH
    ```

3.  **Force push** the change to GitHub (be careful, this overwrites the remote history):
    ```bash
    git push origin main --force
    ```

### Specific Commits from Recent Session

- **Latest Version (Current):** `3e28c5d` (Fix translations and enhance UI)
- **Previous Working Version (Before Translations):** `c0a3ec1` (Fix A/R display and add sorting)
- **Before Today's Session:** `dfc4d28`

To go back to the version **before** the translation fixes but **keeping** the sorting/AR fixes:
```bash
git reset --hard c0a3ec1
git push origin main --force
```
