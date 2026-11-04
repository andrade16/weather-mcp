#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { logger } from "./lib/logger.js";
import { createServer } from "./server.js";

serveStdio(createServer, {
  onerror: (error) => logger.error("Weather MCP Server error:", error),
});

logger.info("Weather MCP Server running on stdio");
