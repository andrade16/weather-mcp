import { afterEach, describe, expect, it, vi } from "vitest";
import { getAlerts, getForecast } from "../../src/services/nws/client.js";
import { NwsError } from "../../src/services/nws/errors.js";
import {
  alertsBody,
  FORECAST_URL,
  forecastBody,
  mockFetch,
  POINTS_URL,
  pointsBody,
} from "../helpers.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAlerts", () => {
  it("requests alerts for the uppercased state with NWS headers", async () => {
    const fetch = mockFetch({ body: alertsBody });

    await getAlerts("ca");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.weather.gov/alerts?area=CA",
      {
        headers: expect.objectContaining({
          "User-Agent": expect.any(String),
          Accept: "application/geo+json",
        }),
      },
    );
  });

  it("returns parsed alert features", async () => {
    mockFetch({ body: alertsBody });

    const alerts = await getAlerts("CA");

    expect(alerts).toHaveLength(1);
    expect(alerts[0].properties.event).toBe("Flood Warning");
  });

  it("accepts null fields", async () => {
    mockFetch({ body: { features: [{ properties: { event: null } }] } });

    const alerts = await getAlerts("CA");

    expect(alerts[0].properties.event).toBeNull();
  });

  it("defaults to an empty list when features is missing", async () => {
    mockFetch({ body: {} });

    await expect(getAlerts("CA")).resolves.toEqual([]);
  });

  it("throws NwsError with the status on HTTP failure", async () => {
    mockFetch({ status: 500, body: {} });

    const error = await getAlerts("CA").catch((e) => e);

    expect(error).toBeInstanceOf(NwsError);
    expect(error.status).toBe(500);
  });

  it("throws NwsError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(getAlerts("CA")).rejects.toThrow(
      new NwsError("Could not reach the NWS API: fetch failed"),
    );
  });

  it("throws NwsError on an unexpected response shape", async () => {
    mockFetch({ body: { features: "not-an-array" } });

    await expect(getAlerts("CA")).rejects.toThrow(/unexpected response format/);
  });
});

describe("getForecast", () => {
  it("looks up the grid point, then fetches its forecast", async () => {
    const fetch = mockFetch({ body: pointsBody }, { body: forecastBody });

    const periods = await getForecast(38.8894, -77.0352);

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([POINTS_URL, FORECAST_URL]);
    expect(periods).toEqual(forecastBody.properties.periods);
  });

  it("rounds coordinates to 4 decimals in the points URL", async () => {
    const fetch = mockFetch({ body: pointsBody }, { body: forecastBody });

    await getForecast(38.889444444, -77.035222222);

    expect(fetch.mock.calls[0][0]).toBe(POINTS_URL);
  });

  it("explains that only US locations are supported on a points 404", async () => {
    mockFetch({ status: 404, body: {} });

    await expect(getForecast(51.5, -0.12)).rejects.toThrow(/Only US locations/);
  });

  it("passes through other points errors unchanged", async () => {
    mockFetch({ status: 503, body: {} });

    await expect(getForecast(38.8894, -77.0352)).rejects.toThrow("NWS API returned HTTP 503");
  });

  it("throws NwsError when the grid point has no forecast URL", async () => {
    const fetch = mockFetch({ body: { properties: {} } });

    await expect(getForecast(38.8894, -77.0352)).rejects.toBeInstanceOf(NwsError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws NwsError when the forecast request fails", async () => {
    mockFetch({ body: pointsBody }, { status: 500, body: {} });

    await expect(getForecast(38.8894, -77.0352)).rejects.toBeInstanceOf(NwsError);
  });
});
