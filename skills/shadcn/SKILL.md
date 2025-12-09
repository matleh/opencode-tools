---
name: shadcn
description: Browse, search, and view shadcn/ui components. Use this skill to find available components, check their dependencies, and view source code before adding them to a project.
---

# shadcn/ui Components

Browse and inspect shadcn/ui components directly from the registry.

## When to Use

- Finding what components are available in shadcn/ui
- Checking component dependencies before installation
- Viewing component source code to understand implementation
- Looking up which other shadcn components a component requires

## Scripts

All scripts are in the `scripts/` directory relative to this skill's base directory.

### List All Components

Show all available components in the shadcn/ui registry:

```bash
bun run scripts/list.ts [--type <type>] [--json]
```

**Options:**
- `--type, -t` - Filter by type (e.g., `registry:ui`, `registry:hook`)
- `--json` - Output raw JSON

**Examples:**
```bash
bun run scripts/list.ts
bun run scripts/list.ts --type registry:ui
```

### Search Components

Find components by name:

```bash
bun run scripts/search.ts <query> [--limit <n>] [--json]
```

**Arguments:**
- `query` - Search term to match against component names

**Options:**
- `--limit, -l` - Max results (default: 10)
- `--json` - Output raw JSON

**Examples:**
```bash
bun run scripts/search.ts button
bun run scripts/search.ts input --limit 5
bun run scripts/search.ts dialog
```

### Show Component Details

View full details and source code for a component:

```bash
bun run scripts/show.ts <name> [--style <style>] [--code-only] [--json]
```

**Arguments:**
- `name` - Component name (e.g., `button`, `dialog`, `form`)

**Options:**
- `--style, -s` - Style variant: `default` or `new-york` (default: `default`)
- `--code-only, -c` - Only output source code, no metadata
- `--json` - Output raw JSON

**Examples:**
```bash
bun run scripts/show.ts button
bun run scripts/show.ts dialog --style new-york
bun run scripts/show.ts form --code-only
```

## Installing Components

This skill is read-only. To add a component to your project, run:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog card form
```

## Tips

- Use `search` to find components if you're unsure of the exact name
- Check `registryDependencies` in `show` output - these are other shadcn components that will be installed automatically
- The `--code-only` flag is useful when you just want to see the implementation
- Style `new-york` has slightly different styling than `default`
