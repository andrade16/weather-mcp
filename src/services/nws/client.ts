import type { z } from "zod";
import { NWS_API_BASE, USER_AGENT } from "../../config.js";
import { NwsError } from "./errors.js";

import {
  AlertsResponseSchema,
  ForecastResponseSchema,
  PointsResponseSchema,
  type AlertFeature,
  type ForecastPeriod,
} from "./schemas.js";

async function nwsRequest<T extends z.ZodType>(
  url: string,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
    });

    if (!response.ok) {
      throw new NwsError(
        `NWS API returned HTTP ${response.status}`,
        response.status,
      );
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof NwsError) throw error;
    throw new NwsError(
      `Could not reach the NWS API: ${(error as Error).message}`,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new NwsError("NWS API returned an unexpected response format");
  }
  return parsed.data;
}

export async function getAlerts(state: string): Promise<AlertFeature[]> {
  const data = await nwsRequest(
    `${NWS_API_BASE}/alerts?area=${state.toUpperCase()}`,
    AlertsResponseSchema,
  );
  return data.features;
}

export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastPeriod[]> {
  let points;
  try {
    points = await nwsRequest(
      `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      PointsResponseSchema,
    );
  } catch (error) {
    if (error instanceof NwsError && error.status === 404) {
      throw new NwsError(
        `No grid point data for ${latitude}, ${longitude}. Only US locations are supported.`,
        404,
      );
    }
    throw error;
  }

  const forecastUrl = points.properties.forecast;

  if (!forecastUrl) {
    throw new NwsError("Grid point data did not incldue a forecast URL");
  }

  const forecast = await nwsRequest(forecastUrl, ForecastResponseSchema);
  return forecast.properties.periods;
}
