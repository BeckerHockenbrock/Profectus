#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  createQuest,
  getBrief,
  isValidDateId,
  listQuests,
  setBrief,
  todayUtcDateId,
} from "./firebase.js";

const tools = [
  {
    name: "get_brief",
    description:
      "Read the signed-in user's Profectus daily brief for a date (defaults to today UTC).",
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
    description:
      "Write/update the signed-in user's Profectus daily brief. Content is provided by the caller; no prompting happens here.",
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
    description: "List the signed-in user's Profectus quests.",
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
    description: "Create a quest for the signed-in Profectus user.",
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
  { name: "profectus-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};

  try {
    let result;
    if (name === "get_brief") {
      const date = typeof args.date === "string" && args.date.trim() ? args.date.trim() : todayUtcDateId();
      if (!isValidDateId(date)) throw new Error("date must be YYYY-MM-DD");
      result = await getBrief(date);
    } else if (name === "set_brief") {
      const date = typeof args.date === "string" && args.date.trim() ? args.date.trim() : todayUtcDateId();
      if (!isValidDateId(date)) throw new Error("date must be YYYY-MM-DD");
      if (typeof args.body !== "string") throw new Error("body is required");
      result = await setBrief({
        date,
        title: typeof args.title === "string" ? args.title : "",
        body: args.body,
      });
    } else if (name === "list_quests") {
      result = await listQuests({
        completed: typeof args.completed === "boolean" ? args.completed : undefined,
        limit: typeof args.limit === "number" ? args.limit : 50,
      });
    } else if (name === "create_quest") {
      result = await createQuest({
        title: args.title,
        description: args.description,
        category: args.category,
        dueDate: args.dueDate,
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
