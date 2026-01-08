---
description: Create a git commit for uncommitted changes
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git commit:*)
---

## Context

<git_status>
!`git status`
</git_status>

<git_diff>
!`git diff HEAD`
</git_diff>

<recent_commits>
!`git log --oneline -10`
</recent_commits>

<arguments>
$ARGUMENTS
</arguments>

## Task

Based on the changes above:

1. Analyze all staged and unstaged changes
2. Generate a clear, concise commit message following Conventional Commits format
3. Stage all relevant changes
4. Create the commit

If specific message provided via {arguments}, use that instead - or follow the special instructions given in {arguments}.
