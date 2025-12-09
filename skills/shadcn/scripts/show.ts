import { defineCommand, runMain } from "citty";

interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target?: string;
}

interface ComponentResponse {
  $schema?: string;
  name: string;
  type: string;
  author?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  tailwind?: object;
  cssVars?: object;
}

const REGISTRY_BASE = "https://ui.shadcn.com/r/styles";

const main = defineCommand({
  meta: {
    name: "shadcn-show",
    description: "Show details and source code for a shadcn/ui component",
  },
  args: {
    name: {
      type: "positional",
      description: "Component name (e.g., button, dialog, form)",
      required: true,
    },
    style: {
      type: "string",
      description: "Style variant: default or new-york",
      default: "default",
      alias: "s",
    },
    json: {
      type: "boolean",
      description: "Output raw JSON",
      default: false,
    },
    codeOnly: {
      type: "boolean",
      description: "Only output the source code (no metadata)",
      default: false,
      alias: "c",
    },
  },
  async run({ args }) {
    const style = args.style === "new-york" ? "new-york" : "default";
    const url = `${REGISTRY_BASE}/${style}/${args.name}.json`;

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 404) {
        console.error(`Error: Component '${args.name}' not found`);
        console.error(`URL tried: ${url}`);
        console.error("\nUse 'bun run scripts/search.ts <query>' to find valid component names");
      } else {
        console.error(`Error: ${res.status} ${res.statusText}`);
      }
      process.exit(1);
    }

    const data: ComponentResponse = await res.json();

    if (args.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (args.codeOnly) {
      for (const file of data.files) {
        if (data.files.length > 1) {
          console.log(`// ${file.path}`);
        }
        console.log(file.content);
        if (data.files.length > 1) {
          console.log("\n");
        }
      }
      return;
    }

    // Full output with metadata
    console.log(`# ${data.name}`);
    console.log(`Type: ${data.type}`);
    console.log(`Style: ${style}`);
    if (data.author) {
      console.log(`Author: ${data.author}`);
    }
    console.log("");

    if (data.dependencies?.length) {
      console.log("## NPM Dependencies\n");
      for (const dep of data.dependencies) {
        console.log(`  - ${dep}`);
      }
      console.log("");
    }

    if (data.registryDependencies?.length) {
      console.log("## Registry Dependencies\n");
      console.log("These shadcn/ui components are required:\n");
      for (const dep of data.registryDependencies) {
        console.log(`  - ${dep}`);
      }
      console.log("");
    }

    console.log("## Source Files\n");
    for (const file of data.files) {
      console.log(`### ${file.path}\n`);
      
      // Determine language from file extension
      const ext = file.path.split(".").pop() || "tsx";
      const lang = ext === "ts" ? "typescript" : ext === "tsx" ? "tsx" : ext;
      
      console.log(`\`\`\`${lang}`);
      console.log(file.content);
      console.log("```\n");
    }

    // Installation instructions
    console.log("## Installation\n");
    console.log("To add this component to your project, run:\n");
    console.log("```bash");
    console.log(`npx shadcn@latest add ${args.name}`);
    console.log("```");
  },
});

runMain(main);
