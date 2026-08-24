import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Centralized error formatting. Keep this last in the middleware chain.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Unexpected error" });
}
