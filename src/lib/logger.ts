import { error } from "node:console";
import { unknown } from "zod";

export const logger = {
  info: (...args: unknown[]) => console.error("[info]", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
};
