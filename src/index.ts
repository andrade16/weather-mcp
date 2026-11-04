import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { NWS_API_BASE } from "./config.js";
import { makeNWSRequest } from "./services/nws/client.js";
import {
  AlertsResponse,
  ForecaseResponse,
  PointsResponse,
} from "./services/nws/types.js";
import { formatAlert } from "./formatters/alert.js";
import { formatForecast } from "./formatters/forecast.js";

function createServer() {
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
  });

  server.registerTool(
    "get_alerts",
    {
      description: "Get weather alerts for a state",
      inputSchema: z.object({
        state: z
          .string()
          .length(2)
          .describe("Two-letter state code (e.g. CA, NY)"),
      }),
    },
    async ({ state }) => {
      const stateCode = state.toUpperCase();
      const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
      const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

      if (!alertsData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retreive alerts data",
            },
          ],
        };
      }

      const features = alertsData.features || [];

      if (!features.length) {
        return {
          content: [
            {
              type: "text",
              text: `No active alerts for ${stateCode}`,
            },
          ],
        };
      }

      const formattedAlerts = features.map(formatAlert);
      const alertsText = `Active alerts for ${stateCode}: \n\n${formattedAlerts.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: "alertsText",
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_forecast",
    {
      description: "Get weather forecase for a location",
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
      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

      if (!pointsData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
            },
          ],
        };
      }

      const forecastUrl = pointsData.properties?.forecast;

      if (!forecastUrl) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get forecast URL from grid point data",
            },
          ],
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest<ForecaseResponse>(forecastUrl);

      if (!forecastData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve forecast data",
            },
          ],
        };
      }

      const periods = forecastData.properties?.periods || [];

      if (periods.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No forecast periods available",
            },
          ],
        };
      }

      // Format forecast periods

      const formattedForecast = periods.map(formatForecast);

      const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: "forecastText",
          },
        ],
      };
    },
  );

  return server;
}

serveStdio(createServer, {
  onerror: (error) => console.error("Weather MCP Server error: ", error),
});

console.error("Weather MCP Server running on stdio");
