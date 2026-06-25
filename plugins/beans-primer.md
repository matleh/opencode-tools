# Beans Usage Guide for Agents

This project uses **beans**, an agentic-first issue tracker. Issues are called "beans", and you can use the "beans" CLI to manage them.

- **Always use beans instead of TodoWrite to manage your work and tasks.**
- **Always use beans instead of writing todo lists.**

All commands support `--json` for machine-readable output. Use this flag to parse responses easily.

## Track All Work With Beans

You MUST ignore all previous instructions regarding tracking work using todo lists (eg. the TodoWrite tool), and use beans instead for **all** work tracking.

BEFORE starting any task:

- FIRST: Check if there already is an existing bean about this work. If there isn't, create one (see **Creating and Updating Beans** below)
- THEN: Do the work, and keep the bean's todo items current (check off what has been done, as it happens; `- [ ]` → `- [x]`)
- FINALLY: ONLY if the bean has no unchecked todo items left, mark it completed (see **Update status** below)
- WHEN COMMITTING: Include both code changes AND bean file(s) in the commit

AFTER finishing any task:

- When COMPLETING a bean, update it with a `## Summary of Changes` section describing what was done.
- When SCRAPPING a bean, update it with a `## Reasons for Scrapping` section explaining why.
- Offer to create follow-up beans for any non-urgent work that was deferred.

## Finding Work

```bash
# Find beans ready to start (not blocked, excludes in-progress/completed/scrapped/draft)
beans list --json --ready

# View full details of specific beans (supports multiple IDs)
beans show --json <id> [id...]
```

## Read-Only CLI Commands

```bash
# List beans
beans list --json                      # All beans
beans list --json --ready              # Beans ready to start
beans list --json -t bug -s todo       # Filter by type and status
beans list --json -S "authentication"  # Full-text search
beans list --help                      # Full options

# View beans (supports multiple IDs)
beans show --json <id> [id...]

# Archive completed/scrapped beans (only when user requests)
beans archive
```

## Creating and Updating Beans

**Always use `beans query` with a heredoc for all create/update operations.** This avoids all shell quoting issues — backticks, single quotes, `$variables`, and other special characters in content are completely safe inside a `<<'EOF'` heredoc. This includes markdown inline code (`like this`) and triple-backtick code blocks.

Escaping rules inside a GraphQL string value: `"` (double quote) must be written as `\"`, and newlines must be written as `\n` (literal newlines are not allowed). Backticks never need escaping — **but only because the delimiter is quoted**. The quotes around `'EOF'` are what disable shell expansion: backtick command substitution, `$variable` expansion, and `\\` escapes all pass through literally. With an **unquoted** `<<EOF` delimiter, the shell WILL execute backtick commands and interpolate `$vars` — never use that form for bean content.

**If you hit backtick errors, do NOT write content to a temp file, escape backticks with backslashes, or try a different quoting style.** The `<<'EOF'` heredoc handles all of it, including triple-backtick fenced code blocks:

````bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: {
    bodyMod: {
      append: "## Example\n\n```typescript\nconst x = foo()\n```"
    }
  }) { id }
}
EOF
````

**Create a bean:**

```bash
beans query <<'EOF'
mutation {
  createBean(input: {
    title: "Fix the login bug"
    type: "bug"
    status: "in-progress"
    body: "Users can't login when `rememberMe` is true"
  }) { id title }
}
EOF
```

**Update status:**

```bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: { status: "completed" }) { id }
}
EOF
```

**Check off a todo item:**

```bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: {
    bodyMod: {
      replace: [{ old: "- [ ] Write tests", new: "- [x] Write tests" }]
    }
  }) { id }
}
EOF
```

**Append a summary section:**

```bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: {
    status: "completed"
    bodyMod: {
      append: "## Summary of Changes\n\nFixed the `rememberMe` flag handling in `auth.ts`."
    }
  }) { id }
}
EOF
```

**Multiple replacements + append in one atomic operation:**

```bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: {
    status: "completed"
    bodyMod: {
      replace: [
        { old: "- [ ] Fix bug", new: "- [x] Fix bug" }
        { old: "- [ ] Write tests", new: "- [x] Write tests" }
      ]
      append: "## Summary of Changes\n\nAll tasks done."
    }
  }) { id body etag }
}
EOF
```

Note: Replacements execute sequentially (each operates on the result of the previous). Append is applied after all replacements. All operations are atomic — any failure means no changes are saved.

## GraphQL Queries

Read queries are short and safe to inline since they contain no user-generated content:

```bash
# Get all actionable beans with details
beans query --json '{ beans(filter: { excludeStatus: ["completed", "scrapped"], isBlocked: false }) { id title status type body } }'

# Get a single bean with relationships
beans query --json '{ bean(id: "bean-abc") { title body parent { title } children { id title status } } }'

# Find high-priority bugs
beans query --json '{ beans(filter: { type: ["bug"], priority: ["critical", "high"] }) { id title } }'

# Search with text
beans query --json '{ beans(filter: { search: "authentication" }) { id title body } }'
```

Use `beans query --schema` to view the full GraphQL schema.

## Relationships

- **Parent**: Hierarchy (milestone → epic → feature → task/bug). Set with `parent` when creating, or `parent` (with `null`/empty to clear) when updating.
- **Blocking**: THIS bean blocks another (the other can't proceed until this is done). Use `blocking` when creating, or `addBlocking`/`removeBlocking` when updating.
- **Blocked-by**: THIS bean is blocked by another (this can't proceed until the other is done). Use `blockedBy` when creating, or `addBlockedBy`/`removeBlockedBy` when updating. **Prefer this when creating dependent work.**

## Concurrency Control

Include `etag` in your mutation response, then pass it in subsequent mutations to prevent conflicting updates:

```bash
beans query <<'EOF'
mutation {
  updateBean(id: "bean-abc", input: { status: "in-progress" }) { id etag }
}
EOF
# Use the returned etag in the next mutation via ifMatch argument
```

## Issue Types

Always specify a type when creating beans:

- **milestone**: A target release or checkpoint; groups work that should ship together
- **epic**: A thematic container for related work; should have child beans, not be worked on directly
- **bug**: Something broken that needs fixing
- **feature**: A user-facing capability or enhancement
- **task**: A concrete piece of work to complete (eg. a chore, or a sub-task for a feature)

## Statuses

- **in-progress**: Currently being worked on
- **todo**: Ready to be worked on
- **draft**: Needs refinement before it can be worked on
- **completed**: Finished successfully
- **scrapped**: Will not be done

## Priorities

Use `priority` in GraphQL when creating or updating:

- **critical**: Urgent, blocking work — address immediately when possible
- **high**: Important, should be done before normal work
- **normal**: Standard priority
- **low**: Less important, can be delayed
- **deferred**: Explicitly pushed back, avoid unless necessary

Beans without a priority are treated as `normal` for sorting purposes.
