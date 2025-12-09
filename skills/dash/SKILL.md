---
name: dash
description: Search local Dash documentation for function signatures, API references, and code examples
version: 1.0.0
---

# Dash API Documentation Search

Search locally installed documentation in Dash without leaving your development environment.

## Finding the API Port

The Dash API runs on a variable port. Find it with:

```bash
cat ~/Library/Application\ Support/Dash/.dash_api_server/status.json
```

Extract the `port` field from the JSON response. All endpoints use `http://127.0.0.1:{port}`.

## List Available Docsets

```
GET /docsets/list
```

Returns all installed docsets with their metadata.

**Response:**

```json
{
  "docsets": [
    {
      "name": "JavaScript",
      "identifier": "wsqdiqxq",
      "path": "~/Library/Application Support/Dash/DocSets/JavaScript/JavaScript.docset",
      "platform": "javascript",
      "full_text_search": "disabled"
    }
  ]
}
```

Use the `identifier` field to target specific docsets in searches.

## Search Documentation

```
GET /search?query=<string>&docset_identifiers=<ids>&search_snippets=<boolean>&max_results=<number>
```

**Parameters:**

- `query` (required) - Search term (e.g., "Promise", "table.insert", "jsonb")
- `docset_identifiers` (optional) - Comma-separated docset IDs to limit search (get from `/docsets/list`)
- `search_snippets` (optional, default=true) - Include saved code snippets in results
- `max_results` (optional, default=100) - Maximum results to return

**Response:**

```json
{
  "results": [
    {
      "name": "Promise.all",
      "load_url": "http://127.0.0.1:63456/Dash/.../manual.html#section",
      "type": "Function",
      "platform": "javascript",
      "docset": "JavaScript",
      "description": "Returns a promise that resolves when all promises resolve"
    }
  ]
}
```

**Result Fields:**

- `name` - Entry name (function, class, method, etc.)
- `load_url` - URL to open in documentation viewer
- `type` - Result type (Function, Class, Method, Snippet, etc.)
- `docset` - Name of the source docset
- `platform` - Language/platform (documentation results only)
- `description` - Brief description if available
- `language` - Code language (snippet results only)
- `tags` - Snippet tags (snippet results only)

## Examples

List all docsets:

```
GET http://127.0.0.1:{port}/docsets/list
```

Search all docsets:

```
GET http://127.0.0.1:{port}/search?query=async
```

Search specific docset:

```
GET http://127.0.0.1:{port}/search?query=Promise&docset_identifiers=wsqdiqxq&max_results=10
```

Search without snippets:

```
GET http://127.0.0.1:{port}/search?query=jsonb&search_snippets=false
```

## Full API Documentation

For complete API schema and all available endpoints:

```
GET http://127.0.0.1:{port}/schema
```

Returns OpenAPI 3.0 specification for the Dash HTTP API.
