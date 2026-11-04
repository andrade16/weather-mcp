import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { formatForecast } from "../formatters/forecast.js";
import { errorResult, textResult } from "../lib/tool-result.js";
import { getForecast } from "../services/nws/client.js";
import { NwsError } from "../services/nws/errors.js";

export function registerGetForecast(server: McpServer) {
  server.registerTool(
    "get_forecast",
    {
      description: "Get the weather forecast for a US location",
      inputSchema: z.object({
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude of the location"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude of the location"),
      }),
    },
    async ({ latitude, longitude }) => {
      try {
        const periods = await getForecast(latitude, longitude);
        if (periods.length === 0) {
          return textResult("No forecast periods available");
        }
        return textResult(
          `Forecast for ${latitude}, ${longitude}:\n\n${periods.map(formatForecast).join("\n")}`,
        );
      } catch (error) {
        if (error instanceof NwsError) {
          return errorResult(error.message);
        }
        throw error;
      }
    },
  );
}
