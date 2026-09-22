import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ZodErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({ error: "Validation failed.", details: err.issues.map((i) => ({ path: i.path.join("/"), message: i.message })) });
    return;
  }
  next(err);
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({ error: "Invalid input.", details: err.flatten() });
    return;
  }
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Error && err.message.includes("P2002")) {
    res.status(409).json({ error: "This record already exists." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Server error. Please try again later." });
}