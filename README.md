# weather-mcp

A Model Context Protocol (MCP) server that gives AI assistants access to US weather data from the
[National Weather Service API](https://www.weather.gov/documentation/services-web-api).

## Tools

- **`get_alerts`**: active weather alerts for a US state (e.g. `CA`, `NY`)
- **`get_forecast`**: the forecast for a latitude/longitude (US locations only)

Built with TypeScript, the MCP TypeScript SDK, and Zod. API responses are validated against Zod
schemas, and failures come back as tool error results the model can act on.

## Usage

```bash
npm install
npm run build
npm test
```

Run the server over stdio with `node build/index.js`. You can also add it to an MCP client
(e.g. Claude Desktop) with `node /absolute/path/to/weather-mcp/build/index.js` as the command.

## Project structure

```
src/
  index.ts          # Entrypoint: starts the server over stdio
  server.ts         # createServer(): builds the McpServer and registers tools
  config.ts         # NWS API base URL and user agent
  tools/            # One file per MCP tool (input schema + handler)
  services/nws/     # NWS API client, Zod response schemas, NwsError
  formatters/       # Turn NWS data into readable text
  lib/              # Tool result helpers and stderr logger
test/
  services/         # Unit tests for the NWS client (mocked fetch)
  tools/            # Integration tests via an in-memory MCP client
  formatters.test.ts
```
