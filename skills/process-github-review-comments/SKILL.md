---
name: process-github-review-comments
description: Handle GitHub PR review comments end-to-end. Use this skill when the user asks to address, process, work through, or respond to PR review comments or reviewer feedback.
---

# Process GitHub PR Review Comments

End-to-end workflow for reviewing, triaging, fixing, and responding to unresolved GitHub PR review comments.

## When to Use

- When the user asks to "process", "handle", "review", or "address" PR review comments
- After receiving a code review and wanting to work through the feedback systematically
- When you want a second opinion on whether review comments are valid before acting on them

---

## Workflow

### Step 1 — Determine the PR Number

If the user supplied a PR number, use it. Otherwise:

```bash
# Get current branch
git branch --show-current

# Try to find associated PR
gh pr view --json number,title,url 2>/dev/null
```

If no PR is found automatically, ask the user:

> "I couldn't automatically determine the PR number. Please provide it, or confirm the branch name to search for."

### Step 2 — Fetch Unresolved Review Comments

```bash
# Fetch all review comments (inline code comments)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --paginate \
  --jq '[.[] | select(.in_reply_to_id == null) | {
    id: .id,
    path: .path,
    line: (.line // .original_line),
    side: .side,
    body: .body,
    author: .user.login,
    created_at: .created_at,
    diff_hunk: .diff_hunk,
    url: .html_url,
    pull_request_review_id: .pull_request_review_id
  }]'
```

Then determine which are unresolved by checking for review threads:

```bash
# Use GraphQL to get thread resolution status
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          isOutdated
          comments(first: 1) {
            nodes {
              databaseId
              path
              line
              body
              author { login }
              url
            }
          }
        }
      }
    }
  }
}'
```

Filter to threads where `isResolved: false` and `isOutdated: false`.

To get owner and repo:
```bash
gh repo view --json owner,name
```

### Step 3 — Evaluate Each Comment Against the Current Codebase

For each unresolved comment:

1. **Read the referenced file** at the commented path
2. **Locate the relevant lines** — note that the file may have changed since the comment was posted
3. **Analyze the comment** critically:
   - Is the issue still present in the current code?
   - Is the reviewer's suggestion correct, or are there trade-offs?
   - What is the actual severity? (bug / correctness issue, style/convention, nitpick, subjective preference, outdated/no longer applies)
   - Is the fix straightforward, complex, or a larger design decision?

Classify each comment:

| Category | Meaning |
|---|---|
| **Fix now** | Clear issue, straightforward fix, worth doing |
| **Discuss / follow-up** | Valid concern but involves design decisions or significant refactoring; better as a ticket |
| **Ignore / decline** | Issue no longer exists in current code, subjective preference, or reviewer is mistaken |

### Step 4 — Present Triage Report to User

Output a structured report for ALL unresolved comments:

```
## PR #<number> — Unresolved Review Comments

### Fix Now (N comments)

**[1] `path/to/file.ts:42` — @reviewer**
> "The error is swallowed here without logging"
**Assessment:** Valid bug — the catch block discards the error silently. Still present in current code.
**Severity:** High — could hide production issues
**Suggested fix:** Add `console.error` or pass to error handler

---

### Follow-up / Create Ticket (N comments)

**[2] `src/api/index.ts:88` — @reviewer**
> "Consider extracting this into a separate service"
**Assessment:** Valid architectural suggestion, but touches 8+ files and warrants its own PR
**Severity:** Low — not a bug, improves maintainability
**Recommendation:** Create a follow-up issue

---

### Ignore / Decline (N comments)

**[3] `utils/format.ts:15` — @reviewer**
> "Use `const` instead of `let` here"
**Assessment:** Already fixed in current code (line 15 now uses `const`)
**Status:** No longer applicable
```

**Wait for user feedback before proceeding.**

Ask: "Which of these would you like me to fix? You can say 'fix all recommended', list specific numbers, or adjust the plan."

### Step 5 — Fix Selected Issues

For each issue the user wants fixed:

1. Read the current file content
2. Apply the minimal, correct fix
3. Do not make unrelated changes
4. If a fix affects multiple files, handle them all

After all fixes:

```bash
git diff
```

### Step 6 — Present Changes to User

Show a summary of what was changed:

```
## Changes Made

**[1] `path/to/file.ts`** — Added error logging in catch block (line 42)
**[2] `src/utils/parser.ts`** — Fixed null check before accessing `.length`

Run `git diff` to review the full diff.
```

**Wait for user feedback.**

Options to offer:
- "Looks good — commit these"
- "Commit as fixup to a specific commit: `git commit --fixup=<sha>`"
- "I want to make further changes first"
- "Revert everything and start over"

Handle whichever the user chooses. For a regular commit:
```bash
git add -p   # or git add <specific files>
git commit -m "fix: address PR review comments"
```

For a fixup commit:
```bash
git commit --fixup=<sha>
```

### Step 7 — Ask User to Push

Do NOT push automatically. Instead:

```
The changes are committed. When you're ready, push with:

  git push
  # or if you need to force-push (e.g. after fixup + rebase):
  git push --force-with-lease
```

Ask the user: "Would you like me to push for you, or will you do it manually?"

If the user confirms, run the appropriate push command (prefer `--force-with-lease` over `--force`).

### Step 8 — Draft Responses to Each Addressed Comment

For each comment that was fixed, ignored, or deferred, draft a response:

**For fixed issues:**
> "Fixed in <commit sha> — <brief description of what was changed>"

**For ignored/declined issues:**
> "Thanks for the review! This was already addressed in <earlier commit> / The current implementation intentionally does X because Y."

**For deferred/follow-up issues:**
> "Good point — I've created a follow-up issue to track this: <link or 'will create'>"

Present all drafts to the user:

```
## Draft Responses

**Comment [1]** (`path/to/file.ts:42`):
> "Fixed in abc1234 — added error logging to the catch block so errors are surfaced via the error handler."

**Comment [2]** (`src/api/index.ts:88`):
> "Great suggestion! I've opened a follow-up issue to extract this into a service layer as part of a broader refactor."

**Comment [3]** (`utils/format.ts:15`):
> "This was already fixed in a previous commit — the variable now uses `const`."

Shall I post these responses and resolve the threads?
```

**Wait for user confirmation before posting anything.**

### Step 9 — Post Responses and Resolve Threads (Only If Confirmed)

For each comment to reply to:

```bash
# Post a reply to a review comment thread
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --method POST \
  -f body="<reply text>" \
  -f in_reply_to=<comment_id>
```

To resolve a thread (requires GraphQL):

```bash
gh api graphql -f query='
mutation {
  resolveReviewThread(input: { threadId: "<thread_node_id>" }) {
    thread {
      isResolved
    }
  }
}'
```

To get thread node IDs, use the GraphQL query from Step 2 — the `reviewThreads.nodes` will have `id` fields (these are the node IDs needed for the mutation).

After posting:

```
## Done

Replied to N comments and resolved N threads.
PR #<number>: <url>
```

---

## Important Rules

- **Never post comments or resolve threads without explicit user confirmation**
- **Never push without asking the user first**
- **Do not make speculative or unrelated changes** — fix only what was discussed
- **Prefer `--force-with-lease` over `--force`** when force-pushing is needed
- **If a comment refers to code that no longer exists**, note it as "no longer applicable" rather than trying to fix it
- **Respect the reviewer** — even when declining a comment, draft a polite, substantive response
- **Check for pagination** when fetching comments — use `--paginate` with the `gh` CLI

## Useful gh CLI Reference

```bash
# View PR details
gh pr view [number]

# List review comments
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate

# Get repo info
gh repo view --json owner,name,url

# Post a comment reply
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --method POST \
  -f body="..." \
  -f in_reply_to=<id>

# Check current user (for filtering your own comments)
gh api user --jq '.login'
```
