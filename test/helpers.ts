import { vi } from "vitest";

type MockResponse = { status?: number; body: unknown };

// Replaces global fetch with a mock that returns the given responses in order.
export function mockFetch(...responses: MockResponse[]) {
  const fn = vi.fn();
  for (const { status = 200, body } of responses) {
    fn.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status }),
    );
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

export const POINTS_URL = "https://api.weather.gov/points/38.8894,-77.0352";
export const FORECAST_URL = "https://api.weather.gov/gridpoints/LWX/97,71/forecast";

export const pointsBody = { properties: { forecast: FORECAST_URL } };
export const forecastBody = {
  properties: {
    periods: [
      {
        name: "Tonight",
        temperature: 50,
        temperatureUnit: "F",
        windSpeed: "5 mph",
        windDirection: "NW",
        shortForecast: "Clear",
      },
    ],
  },
};
export const alertsBody = {
  features: [
    {
      properties: {
        event: "Flood Warning",
        areaDesc: "Los Angeles",
        severity: "Severe",
        status: "Actual",
        headline: "Flood warning in effect",
      },
    },
  ],
};
