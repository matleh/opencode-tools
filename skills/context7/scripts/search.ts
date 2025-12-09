import { defineCommand, runMain } from "citty";

interface Library {
  id: string;
  title: string;
  description: string;
  totalSnippets: number;
  totalTokens: number;
  stars?: number;
  versions?: string[];
}

interface SearchResponse {
  results: Library[];
}

const main = defineCommand({
  meta: {
    name: "context7-search",
    description: "Search for library IDs in Context7",
  },
  args: {
    query: {
      type: "positional",
      description: "Library name to search for (e.g., 'next.js', 'react')",
      required: true,
    },
    limit: {
      type: "string",
      description: "Maximum results to return",
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

    const url = `https://context7.com/api/v2/search?query=${encodeURIComponent(args.query)}`;
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    const data: SearchResponse = await res.json();
    const limit = parseInt(args.limit, 10);
    const results = data.results?.slice(0, limit) ?? [];

    if (args.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.length === 0) {
      console.log(`No libraries found for "${args.query}"`);
      return;
    }

    console.log(`Found ${results.length} libraries:\n`);

    for (const lib of results) {
      console.log(`ID: ${lib.id}`);
      console.log(`Title: ${lib.title}`);
      if (lib.description) {
        console.log(`Description: ${lib.description}`);
      }
      console.log(`Snippets: ${lib.totalSnippets} | Tokens: ${lib.totalTokens}`);
      if (lib.stars) {
        console.log(`Stars: ${lib.stars.toLocaleString()}`);
      }
      if (lib.versions?.length) {
        console.log(`Versions: ${lib.versions.slice(0, 4).join(", ")}`);
      }
      console.log("");
    }
  },
});

runMain(main);
