import { features } from "node:process";
import { properties, z } from "zod";

export const AlertFeatureSchema = z.object({
  properties: z.object({
    event: z.string().nullish(),
    areaDesc: z.string().nullish(),
    severity: z.string().nullish(),
    status: z.string().nullish(),
    headline: z.string().nullish(),
  }),
});

export const AlertsResponseSchema = z.object({
  features: z.array(AlertFeatureSchema).default([]),
});

export const PointsResponseSchema = z.object({
  properties: z.object({
    forecast: z.string().nullish(),
  }),
});

export const ForecastPeriodSchema = z.object({
  name: z.string().nullish(),
  temperature: z.number().nullish(),
  temperatureUnit: z.string().nullish(),
  windSpeed: z.string().nullish(),
  windDirection: z.string().nullish(),
  shortForecast: z.string().nullish(),
});

export const ForecastResponseSchema = z.object({
  properties: z.object({
    periods: z.array(ForecastPeriodSchema).default([]),
  }),
});

export type AlertFeature = z.infer<typeof AlertFeatureSchema>;
export type ForecastPeriod = z.infer<typeof ForecastPeriodSchema>;
