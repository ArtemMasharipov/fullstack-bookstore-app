import { readFileSync } from "node:fs";
import { ValidationError } from "./errors.js";

const { passwords } = JSON.parse(readFileSync(new URL("../data/password-blocklist.json", import.meta.url), "utf8"));
const commonPasswords = new Set(passwords);

export const normalizePassword = (input) => input.normalize("NFKC");

export function newPasswordIssue(input, { username, email } = {}) {
  if (typeof input !== "string") return "invalid_type";
  const normalized = normalizePassword(input);
  const length = [...normalized].length;
  if (length < 15) return "too_small";
  if (length > 128) return "too_big";
  const comparable = normalized.toLowerCase();
  if (commonPasswords.has(comparable)) return "common";
  const context = [username, email?.split("@")[0], "bookstore"]
    .filter((value) => typeof value === "string" && value.length > 0)
    .map((value) => value.normalize("NFKC").toLowerCase());
  return context.some((value) => comparable.includes(value)) ? "context" : null;
}

export function validateNewPassword(input, context, field = "password") {
  const issue = newPasswordIssue(input, context);
  if (issue) throw new ValidationError("Password does not meet the requirements", { [field]: issue });
  return normalizePassword(input);
}
