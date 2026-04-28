---
name: merge-conflict
description: Resolve git conflicts from merge, rebase, cherry-pick, or revert operations. Use this skill when the working tree contains conflict markers (<<<<<<<, =======, >>>>>>>), when git reports unmerged paths, or when the user asks to fix, resolve, or continue after a conflict.
---

# Merge Conflict Resolution

Systematically identify, analyze, and resolve git merge conflicts across the working tree.

## When to Use

- After a `git merge`, `git rebase`, `git cherry-pick`, or `git pull` that produced conflicts
- When files contain `<<<<<<<`, `=======`, or `>>>>>>>` conflict markers
- When asked to resolve, fix, or clean up merge conflicts

## Workflow

### 1. Discover All Conflicted Files

```bash
git diff --name-only --diff-filter=U
```

This lists every file with unresolved conflicts. Work through them one by one.

### 2. Understand the Conflict Context

For each conflicted file:

- Read the full file to understand its purpose and surrounding code
- Identify the **ours** side (`HEAD` / current branch) between `<<<<<<<` and `=======`
- Identify the **theirs** side (incoming branch) between `=======` and `>>>>>>>`
- Check the git log to understand what each side was trying to accomplish:

```bash
# Commits reachable from HEAD but not from the merge base
git log --oneline MERGE_HEAD..HEAD -- <file>

# Commits reachable from the incoming branch but not from HEAD
git log --oneline HEAD..MERGE_HEAD -- <file>
```

- Use `git show` to inspect specific commits if the intent is unclear.

### 3. Choose a Resolution Strategy

| Situation | Strategy |
|---|---|
| One side adds code the other doesn't touch | Keep both — combine them |
| Both sides edit the same lines differently | Merge the intent of both edits |
| One side deletes code the other modifies | Decide based on which change is correct; check tests |
| Pure formatting / whitespace differences | Accept the more consistent style |
| One side is clearly outdated or wrong | Accept the correct side only |

**Always prefer preserving intent over blindly picking one side.**

### 4. Resolve Each Conflict

- Edit the file directly, removing all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) and producing clean, correct code
- Ensure the resolved code compiles / parses correctly
- Maintain the existing code style and conventions of the file
- If a conflict involves imports/dependencies, make sure all required imports are present

### 5. Verify and Stage

After resolving each file:

```bash
# Stage the resolved file
git add <file>

# Confirm no conflict markers remain
git diff --check
```

After resolving all files:

```bash
# Confirm nothing is left unresolved
git diff --name-only --diff-filter=U
```

### 6. Detect the Operation in Progress

Before finalizing, determine what triggered the conflicts by checking which state files git has written:

```bash
# Run in the repo root (adjust path if in a worktree)
ls .git/MERGE_HEAD       2>/dev/null && echo "merge"
ls .git/CHERRY_PICK_HEAD 2>/dev/null && echo "cherry-pick"
ls .git/REVERT_HEAD      2>/dev/null && echo "revert"
ls .git/rebase-merge/    2>/dev/null && echo "rebase (interactive)"
ls .git/rebase-apply/    2>/dev/null && echo "rebase (apply)"
```

Exactly one of these will exist. Use the result to choose the correct finalization command below.

### 7. Finalize (without opening an editor)

All `--continue` commands and `git commit` will try to open an interactive editor for the commit message. Suppress this with `GIT_EDITOR=true` (makes git treat the existing message as-is) or `--no-edit` where the flag is supported:

```bash
# merge (.git/MERGE_HEAD exists)
git commit --no-edit

# rebase (.git/rebase-merge/ or .git/rebase-apply/ exists)
GIT_EDITOR=true git rebase --continue

# cherry-pick (.git/CHERRY_PICK_HEAD exists)
GIT_EDITOR=true git cherry-pick --continue

# revert (.git/REVERT_HEAD exists)
GIT_EDITOR=true git revert --continue
```

Do **not** run `git commit` if a rebase, cherry-pick, or revert is in progress; always use the matching `--continue` command.

## Important Rules

- **Never leave conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) in a file after resolution
- **Do not lose changes** — both sides usually have valuable work; only discard a side when it is clearly wrong or superseded
- **Run tests** if a test suite is available after resolving, to catch regressions:
  ```bash
  # Example — adapt to the project's actual test command
  npm test / pytest / cargo test / go test ./...
  ```
- **Ask the user** before resolving conflicts in generated files, lock files (`package-lock.json`, `Cargo.lock`, etc.), or binary files — these usually need special handling
- For lock files, regenerate rather than hand-edit:
  ```bash
  # Accept one side, then regenerate
  git checkout --ours package-lock.json && npm install
  ```

## Handling Special Cases

### Deleted-by-one / Modified-by-other

```bash
# See which side deleted vs. modified
git status
```
Decide whether the deletion or the modification should win, then either:
```bash
git rm <file>          # accept the deletion
git add <file>         # accept the modification (after editing)
```

### Both Sides Renamed a File

Git may not detect this automatically. Check `git status` for "both added" or "renamed" entries and resolve manually.

### Entire File Conflict (accept one side wholesale)

```bash
git checkout --ours   <file>   # keep current branch version
git checkout --theirs <file>   # keep incoming branch version
git add <file>
```
