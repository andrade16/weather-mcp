import { ForecastPeriod } from "../services/nws/types.js";

function formatForecast(period: ForecastPeriod): string {
  return [
    `${period.name || "Unknown"}:`,
    `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
    `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
    `${period.shortForecast || "No forecast available"}`,
    "---",
  ].join("\n");
}

export { formatForecast };
