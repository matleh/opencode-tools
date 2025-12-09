import { defineCommand, runMain } from "citty";

interface RegistryItem {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

const REGISTRY_URL = "https://ui.shadcn.com/r/index.json";

const main = defineCommand({
  meta: {
    name: "shadcn-search",
    description: "Search for shadcn/ui components by name",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query (matches component names)",
      required: true,
    },
    limit: {
      type: "string",
      description: "Maximum results to return",
      default: "10",
      alias: "l",
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

    const items: RegistryItem[] = await res.json();
    const query = args.query.toLowerCase();
    const limit = parseInt(args.limit, 10);

    // Filter by query (case-insensitive substring match)
    const matches = items
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, limit);

    if (args.json) {
      console.log(JSON.stringify(matches, null, 2));
      return;
    }

    if (matches.length === 0) {
      console.log(`No components found matching "${args.query}"`);
      return;
    }

    console.log(`Found ${matches.length} component(s) matching "${args.query}":\n`);

    for (const item of matches) {
      console.log(`Name: ${item.name}`);
      console.log(`Type: ${item.type}`);
      if (item.dependencies?.length) {
        console.log(`Dependencies: ${item.dependencies.join(", ")}`);
      }
      if (item.registryDependencies?.length) {
        console.log(`Registry deps: ${item.registryDependencies.join(", ")}`);
      }
      console.log("");
    }

    if (matches.length === limit) {
      console.log(`Showing first ${limit} results. Use --limit to see more.`);
    }
  },
});

runMain(main);
