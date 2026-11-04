import { AlertFeature } from "../services/nws/types.js";

function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;

  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
  ].join("\n");
}

export { formatAlert };
