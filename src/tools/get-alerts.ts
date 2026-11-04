import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { formatAlert } from "../formatters/alert.js";
import { errorResult, textResult } from "../lib/tool-result.js";
import { getAlerts } from "../services/nws/client.js";
import { NwsError } from "../services/nws/errors.js";

export function registerGetAlerts(server: McpServer) {
  server.registerTool(
    "get_alerts",
    {
      description: "Get weather alerts for a US state",
      inputSchema: z.object({
        state: z
          .string()
          .length(2)
          .describe("Two-letter state code (e.g. CA, NY)"),
      }),
    },
    async ({ state }) => {
      const stateCode = state.toUpperCase();
      try {
        const alerts = await getAlerts(stateCode);
        if (alerts.length === 0) {
          return textResult(`No active alerts for ${stateCode}`);
        }
        return textResult(
          `Active alerts for ${stateCode}:\n\n${alerts.map(formatAlert).join("\n\n")}`,
        );
      } catch (error) {
        if (error instanceof NwsError) {
          return errorResult(
            `Failed to retrieve alerts for ${stateCode}: ${error.message}`,
          );
        }
        throw error;
      }
    },
  );
}
