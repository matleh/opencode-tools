import { defineCommand, runMain } from "citty";

interface RegistryItem {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path: string; type: string }>;
}

const REGISTRY_URL = "https://ui.shadcn.com/r/index.json";

const main = defineCommand({
  meta: {
    name: "shadcn-list",
    description: "List all available shadcn/ui components",
  },
  args: {
    type: {
      type: "string",
      description: "Filter by type (e.g., registry:ui, registry:hook)",
      alias: "t",
    },
    json: {
      type: "boolean",
      description: "Output raw JSON",
      default: false,
    },
  },
  async run({ args }) {
    const res = await fetch(REGISTRY_URL);

    if (!res.ok) {
      console.error(`Error: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    let items: RegistryItem[] = await res.json();

    // Filter by type if specified
    if (args.type) {
      items = items.filter((item) => item.type === args.type);
    }

    if (args.json) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }

    if (items.length === 0) {
      console.log("No components found");
      if (args.type) {
        console.log(`Filter: type=${args.type}`);
      }
      return;
    }

    console.log(`Found ${items.length} components:\n`);

    // Group by type
    const byType = new Map<string, RegistryItem[]>();
    for (const item of items) {
      const type = item.type || "unknown";
      if (!byType.has(type)) {
        byType.set(type, []);
      }
      byType.get(type)!.push(item);
    }

    for (const [type, typeItems] of byType) {
      console.log(`## ${type} (${typeItems.length})\n`);
      for (const item of typeItems) {
        const deps = item.dependencies?.length || 0;
        const regDeps = item.registryDependencies?.length || 0;
        const depInfo = deps > 0 || regDeps > 0 
          ? ` (${deps} npm deps, ${regDeps} registry deps)` 
          : "";
        console.log(`  ${item.name}${depInfo}`);
      }
      console.log("");
    }
  },
});

runMain(main);
