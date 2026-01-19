import { readFileSync } from "fs";

export function readJsonFile<T>(path: string): T {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
}

export function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
