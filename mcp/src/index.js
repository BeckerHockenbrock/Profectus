#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const APP_URL = (process.env.PROFECTUS_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const BOT_API_KEY = process.env.PROFECTUS_BOT_API_KEY || "";

function requireKey() {
  if (!BOT_API_KEY) {
    throw new Error("PROFECTUS_BOT_API_KEY is required for Profectus MCP.");
  }
}

async function api(path, options = {}) {
  requireKey();
  const response = await fetch(`${APP_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${BOT_API_KEY}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Profectus API returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profectus API error (${response.status})`);
  }

  return data;
}

const tools = [
  {
    name: "get_brief",
    description: "Read the Profectus daily brief for a date (defaults to today UTC).",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Optional YYYY-MM-DD date.",
        },
      },
    },
  },
  {
    name: "set_brief",
    description: "Write/update the Profectus daily brief. Content is provided by the caller; no prompting happens here.",
    inputSchema: {
      type: "object",
      properties: {
        body: {
          type: "string",
          description: "Brief body text.",
        },
        title: {
          type: "string",
          description: "Optional brief title.",
        },
        date: {
          type: "string",
          description: "Optional YYYY-MM-DD date. Defaults to today UTC.",
        },
      },
      required: ["body"],
    },
  },
  {
    name: "list_quests",
    description: "List Profectus quests.",
    inputSchema: {
      type: "object",
      properties: {
        completed: {
          type: "boolean",
          description: "If set, filter by completion state.",
        },
        limit: {
          type: "number",
          description: "Max quests to return (1-200). Default 50.",
        },
      },
    },
  },
  {
    name: "create_quest",
    description: "Create a Profectus quest.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Quest title." },
        description: { type: "string", description: "Optional description." },
        category: { type: "string", description: "Optional category. Defaults to General." },
        dueDate: { type: "string", description: "Optional YYYY-MM-DD due date." },
      },
      required: ["title"],
    },
  },
];

const server = new Server(
  { name: "profectus-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};

  try {
    let result;
    if (name === "get_brief") {
      const date = typeof args.date === "string" ? args.date : undefined;
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      result = await api(`/api/bot/brief${query}`);
    } else if (name === "set_brief") {
      result = await api("/api/bot/brief", {
        method: "PUT",
        body: JSON.stringify({
          body: args.body,
          title: args.title,
          date: args.date,
        }),
      });
    } else if (name === "list_quests") {
      const params = new URLSearchParams();
      if (typeof args.completed === "boolean") params.set("completed", String(args.completed));
      if (typeof args.limit === "number") params.set("limit", String(args.limit));
      const query = params.toString() ? `?${params}` : "";
      result = await api(`/api/bot/quests${query}`);
    } else if (name === "create_quest") {
      result = await api("/api/bot/quests", {
        method: "POST",
        body: JSON.stringify({
          title: args.title,
          description: args.description,
          category: args.category,
          dueDate: args.dueDate,
        }),
      });
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: message }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
