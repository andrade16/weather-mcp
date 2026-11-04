import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../../src/server.js";
import { alertsBody, forecastBody, mockFetch, pointsBody } from "../helpers.js";

let client: Client;

beforeEach(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
});

afterEach(async () => {
  await client.close();
  vi.unstubAllGlobals();
});

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  return result.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

describe("tool listing", () => {
  it("exposes get_alerts and get_forecast with input schemas", async () => {
    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name).sort()).toEqual(["get_alerts", "get_forecast"]);
    const alerts = tools.find((t) => t.name === "get_alerts");
    expect(alerts?.inputSchema.properties).toHaveProperty("state");
  });
});

describe("get_alerts", () => {
  it("returns formatted alerts", async () => {
    mockFetch({ body: alertsBody });

    const result = await client.callTool({ name: "get_alerts", arguments: { state: "ca" } });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain("Active alerts for CA");
    expect(textOf(result)).toContain("Event: Flood Warning");
  });

  it("reports when there are no alerts", async () => {
    mockFetch({ body: { features: [] } });

    const result = await client.callTool({ name: "get_alerts", arguments: { state: "CA" } });

    expect(textOf(result)).toBe("No active alerts for CA");
  });

  it("returns an error result when NWS fails", async () => {
    mockFetch({ status: 500, body: {} });

    const result = await client.callTool({ name: "get_alerts", arguments: { state: "CA" } });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("Failed to retrieve alerts for CA");
  });

  it("rejects a state code that is not two letters", async () => {
    const fetch = mockFetch();

    const result = await client.callTool({ name: "get_alerts", arguments: { state: "CAL" } });

    expect(result.isError).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("get_forecast", () => {
  it("returns a formatted forecast", async () => {
    mockFetch({ body: pointsBody }, { body: forecastBody });

    const result = await client.callTool({
      name: "get_forecast",
      arguments: { latitude: 38.8894, longitude: -77.0352 },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain("Forecast for 38.8894, -77.0352");
    expect(textOf(result)).toContain("Temperature: 50°F");
  });

  it("reports when there are no forecast periods", async () => {
    mockFetch({ body: pointsBody }, { body: { properties: { periods: [] } } });

    const result = await client.callTool({
      name: "get_forecast",
      arguments: { latitude: 38.8894, longitude: -77.0352 },
    });

    expect(textOf(result)).toBe("No forecast periods available");
  });

  it("returns an error result for non-US locations", async () => {
    mockFetch({ status: 404, body: {} });

    const result = await client.callTool({
      name: "get_forecast",
      arguments: { latitude: 51.5, longitude: -0.12 },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("Only US locations are supported");
  });

  it("rejects out-of-range coordinates", async () => {
    const fetch = mockFetch();

    const result = await client.callTool({
      name: "get_forecast",
      arguments: { latitude: 100, longitude: 0 },
    });

    expect(result.isError).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
