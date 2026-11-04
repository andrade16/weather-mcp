import { describe, expect, it } from "vitest";
import { formatAlert } from "../src/formatters/alert.js";
import { formatForecast } from "../src/formatters/forecast.js";
import { alertsBody, forecastBody } from "./helpers.js";

describe("formatAlert", () => {
  it("formats all alert fields", () => {
    expect(formatAlert(alertsBody.features[0])).toBe(
      [
        "Event: Flood Warning",
        "Area: Los Angeles",
        "Severity: Severe",
        "Status: Actual",
        "Headline: Flood warning in effect",
      ].join("\n"),
    );
  });

  it("falls back for missing fields", () => {
    const text = formatAlert({ properties: { event: null } });

    expect(text).toContain("Event: Unknown");
    expect(text).toContain("Headline: No headline");
  });
});

describe("formatForecast", () => {
  it("formats a forecast period", () => {
    expect(formatForecast(forecastBody.properties.periods[0])).toBe(
      ["Tonight:", "Temperature: 50°F", "Wind: 5 mph NW", "Clear", "---"].join("\n"),
    );
  });

  it("renders a temperature of 0 rather than Unknown", () => {
    expect(formatForecast({ temperature: 0 })).toContain("Temperature: 0°F");
  });

  it("falls back for missing fields", () => {
    const text = formatForecast({});

    expect(text).toContain("Unknown:");
    expect(text).toContain("Temperature: Unknown°F");
    expect(text).toContain("No forecast available");
  });
});
