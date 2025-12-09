import { defineCommand, runMain } from "citty";

// Code mode response structure
interface CodeSnippet {
  codeTitle: string;
  codeDescription?: string;
  codeLanguage?: string;
  codeTokens: number;
  pageTitle?: string;
  codeList: Array<{
    language: string;
    code: string;
  }>;
}

// Info mode response structure
interface InfoSnippet {
  content: string;
  contentTokens: number;
  breadcrumb?: string;
  pageId?: string;
}

interface DocsResponse {
  snippets: CodeSnippet[] | InfoSnippet[];
  totalTokens: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function isCodeSnippet(snippet: CodeSnippet | InfoSnippet): snippet is CodeSnippet {
  return "codeList" in snippet;
}

const main = defineCommand({
  meta: {
    name: "context7-docs",
    description: "Fetch documentation from Context7",
  },
  args: {
    library: {
      type: "positional",
      description: "Library ID from search (e.g., /vercel/next.js)",
      required: true,
    },
    topic: {
      type: "string",
      description: "Topic to focus on (e.g., routing, hooks, middleware)",
      alias: "t",
    },
    mode: {
      type: "string",
      description: "Mode: 'code' for API/examples (default), 'info' for guides",
      default: "code",
      alias: "m",
    },
    page: {
      type: "string",
      description: "Page number (1-10)",
      default: "1",
      alias: "p",
    },
    limit: {
      type: "string",
      description: "Results per page (1-10)",
      default: "5",
      alias: "l",
    },
    json: {
      type: "boolean",
      description: "Output raw JSON",
      default: false,
    },
  },
  async run({ args }) {
    const apiKey = process.env.CONTEXT7_API_KEY;

    // Validate mode
    if (args.mode !== "code" && args.mode !== "info") {
      console.error(`Error: mode must be 'code' or 'info', got '${args.mode}'`);
      process.exit(1);
    }

    // Ensure library ID starts with /
    const libraryId = args.library.startsWith("/")
      ? args.library
      : `/${args.library}`;

    // Build URL - must include type=json for JSON response
    const params = new URLSearchParams({
      page: args.page,
      limit: args.limit,
      type: "json",
    });
    if (args.topic) {
      params.set("topic", args.topic);
    }

    const url = `https://context7.com/api/v2/docs/${args.mode}${libraryId}?${params}`;

    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.error(`Error: Library '${libraryId}' not found`);
        console.error("Use the search script to find valid library IDs");
      } else {
        console.error(`Error: ${res.status} ${res.statusText}`);
      }
      process.exit(1);
    }

    const data: DocsResponse = await res.json();

    if (args.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (!data.snippets || data.snippets.length === 0) {
      console.log(
        `No documentation found for ${libraryId}${args.topic ? ` (topic: ${args.topic})` : ""}`
      );
      if (args.topic) {
        console.log("Try a different topic or remove the --topic flag");
      }
      return;
    }

    // Header
    console.log(`# ${libraryId}${args.topic ? ` - ${args.topic}` : ""}`);
    console.log(`Mode: ${args.mode} | Page ${data.pagination.page}/${data.pagination.totalPages} | ${data.totalTokens} tokens\n`);

    // Snippets - handle both code and info modes
    for (const snippet of data.snippets) {
      if (isCodeSnippet(snippet)) {
        // Code mode output
        console.log(`## ${snippet.codeTitle}`);
        if (snippet.codeDescription) {
          console.log(`${snippet.codeDescription}\n`);
        }
        for (const codeBlock of snippet.codeList) {
          console.log(`\`\`\`${codeBlock.language.toLowerCase()}`);
          console.log(codeBlock.code);
          console.log("```\n");
        }
      } else {
        // Info mode output
        if (snippet.breadcrumb) {
          console.log(`## ${snippet.breadcrumb}\n`);
        }
        console.log(snippet.content);
      }
      console.log("\n---\n");
    }

    // Pagination hint
    if (data.pagination.hasNext) {
      console.log(`More results available: --page ${data.pagination.page + 1}`);
    }
  },
});

runMain(main);
