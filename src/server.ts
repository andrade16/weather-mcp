import { McpServer } from "@modelcontextprotocol/server";
import { registerTools } from "./tools/index.js";

export function createServer() {
  const server = new McpServer({ name: "weather", version: "1.0.0" });
  registerTools(server);
  return server;
}
