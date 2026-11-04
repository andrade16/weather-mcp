import type { McpServer } from "@modelcontextprotocol/server";
import { registerGetAlerts } from "./get-alerts.js";
import { registerGetForecast } from "./get-forecast.js";

export function registerTools(server: McpServer) {
  registerGetAlerts(server);
  registerGetForecast(server);
}
