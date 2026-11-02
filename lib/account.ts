/**
 * The register and login forms: what each field accepts, with messages written for the person filling it in.
 * Shared by the browser (checks as you submit, no round trip) and the server (checks again; never trust the browser).
 */
import { z } from "zod";
import { CITIES } from "@/lib/taxonomy";
import type { CityId } from "@/lib/types";

/** What the browser may know about the logged-in person (never the password hash or phone). */
export type PublicUser = { name: string; username: string; city: CityId; email: string };

export const PASSWORD_MIN = 8;

/**
 * Pakistani mobile numbers in any common form ("0300 1234567", "300-1234567", "+92 300 1234567", "923001234567")
 * become one form: +923001234567. Anything else returns null.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  const match = /^(?:92|0)?(3\d{9})$/.exec(digits);
  return match ? `+92${match[1]}` : null;
}

const cityIds = CITIES.map((c) => c.id) as [CityId, ...CityId[]];

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Please write your name.").max(60, "Name is too long (60 letters at most)."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username needs at least 3 letters.")
      .max(20, "Username can be 20 letters at most.")
      .regex(/^[a-z0-9_.]+$/, "Use only English letters, numbers, _ or . (no spaces)."),
    city: z.enum(cityIds, "Please choose your city."),
    email: z.string().trim().toLowerCase().max(120, "Email is too long.").pipe(z.email("Please check the email address.")),
    phone: z
      .string()
      .transform((value, ctx) => {
        const phone = normalizePhone(value);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "Write a mobile number like 0300 1234567." });
          return z.NEVER;
        }
        return phone;
      }),
    password: z.string().min(PASSWORD_MIN, `Password needs at least ${PASSWORD_MIN} characters.`).max(72, "Password is too long (72 at most)."),
    confirmPassword: z.string(),
  })
  .refine((form) => form.password === form.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords are not the same.",
    // Say it together with the other problems, not only after they are fixed.
    when: (payload) => typeof (payload.value as { confirmPassword?: unknown })?.confirmPassword === "string",
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  login: z.string().trim().toLowerCase().min(3, "Write your username or email.").max(120, "That is too long."),
  password: z.string().min(1, "Write your password.").max(72, "Password is too long."),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** Field → first problem, for showing under each field. */
export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}
