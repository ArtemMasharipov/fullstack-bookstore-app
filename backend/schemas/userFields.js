/** Shared account fields; password policy is checked when a password is set. */
import { z } from "zod";

export const username = z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/);
export const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const name = z.string().trim().max(50);
export const newPassword = z.string();
