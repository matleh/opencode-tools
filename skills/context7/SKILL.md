---
name: context7
description: Search and retrieve up-to-date library documentation from Context7. Use this skill when you need current API references, code examples, or usage guides for third-party libraries and frameworks.
---

# Context7 Documentation Research

Fetch current, version-specific documentation for libraries and frameworks directly from Context7.

## When to Use

- Looking up API references for a library
- Finding code examples for specific functionality
- Checking current best practices for a framework
- Verifying correct usage of library features

## Workflow

1. **Search for the library** to get its Context7 ID
2. **Fetch documentation** with a specific topic

## Scripts

All scripts are in the `scripts/` directory relative to this skill's base directory.

### Search for a Library

Find the Context7 library ID for a package:

```bash
bun run scripts/search.ts <query> [--limit <n>] [--json]
```

**Arguments:**
- `query` - Library name to search (e.g., "next.js", "react", "express")
- `--limit, -l` - Max results (default: 5)
- `--json` - Output raw JSON

**Example:**
```bash
bun run scripts/search.ts next.js
bun run scripts/search.ts "tanstack query" --limit 3
```

### Fetch Documentation

Get documentation snippets for a library:

```bash
bun run scripts/docs.ts <library-id> [--topic <topic>] [--mode <mode>] [--page <n>] [--limit <n>] [--json]
```

**Arguments:**
- `library-id` - Context7 library ID from search (e.g., `/vercel/next.js`)
- `--topic, -t` - Focus area (e.g., "routing", "hooks", "middleware")
- `--mode, -m` - `code` (API/examples, default) or `info` (conceptual guides)
- `--page, -p` - Page number 1-10 (default: 1)
- `--limit, -l` - Results per page 1-10 (default: 5)
- `--json` - Output raw JSON

**Examples:**
```bash
bun run scripts/docs.ts /vercel/next.js --topic routing
bun run scripts/docs.ts /tanstack/query --topic "useQuery" --mode code
bun run scripts/docs.ts /expressjs/express -t middleware -p 2
```

## Tips

- Use specific topics to get relevant results and reduce output size
- Start with `code` mode for API references, switch to `info` for conceptual questions
- If results are insufficient, try the next page with `--page 2`
- The library ID always starts with `/` (e.g., `/vercel/next.js`)

## Environment

Requires `CONTEXT7_API_KEY` environment variable for higher rate limits. Works without it but with restrictions.
