"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Dialog, Tabs } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import { account, useAccount, type SubmitResult } from "@/hooks/useAccount";
import { fieldErrors, LoginSchema, PASSWORD_MIN, RegisterSchema, type FieldErrors } from "@/lib/account";
import { CITIES } from "@/lib/taxonomy";
import type { CityId } from "@/lib/types";

/**
 * Log in / Create account, in one window (a bottom sheet on phones). Opens when someone taps "Log in" or does
 * something that needs an account (liking a deal), and says why. Big fields with plain labels, the reason for each
 * problem under its field, and a show/hide switch on passwords, so it is easy for every age.
 */
export function AuthDialog({ city }: { city: CityId | null }) {
  const { prompt } = useAccount();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [shownPrompt, setShownPrompt] = useState(prompt);
  // Each time it opens, start on the tab that was asked for.
  if (prompt !== shownPrompt) {
    setShownPrompt(prompt);
    if (prompt) setTab(prompt.mode);
  }

  return (
    <Dialog.Root open={prompt !== null} onOpenChange={(open) => !open && account.close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="sheet flex max-h-[92svh] flex-col">
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div>
              <Dialog.Title className="text-title">{tab === "login" ? "Welcome back" : "Create your free account"}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-small text-soft">
                {prompt?.reason ?? "Save the deals you like and find them again on any phone or computer."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn -mt-2 -mr-2 shrink-0" aria-label="Close">
              <Icon name="close" className="size-6" />
            </Dialog.Close>
          </div>

          <Tabs.Root value={tab} onValueChange={(value) => setTab(value as "login" | "register")} className="flex min-h-0 flex-1 flex-col">
            <Tabs.List aria-label="Log in or create an account" className="mx-5 grid grid-cols-2 gap-1 rounded-button bg-hover p-1">
              {(["login", "register"] as const).map((value) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="h-10 rounded-[calc(var(--radius-button)-2px)] text-body font-semibold text-soft transition duration-150 focus-visible:outline-2 focus-visible:outline-primary data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-soft"
                >
                  {value === "login" ? "Log in" : "Create account"}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-5">
              <Tabs.Content value="login">
                <LoginForm onSwitch={() => setTab("register")} />
              </Tabs.Content>
              <Tabs.Content value="register">
                <RegisterForm city={city} onSwitch={() => setTab("login")} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Shared by both forms: check in the browser first, then send, then show what the server said. */
function useSubmit() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, check: (form: Record<string, string>) => FieldErrors | null, send: (form: Record<string, string>) => Promise<SubmitResult>) {
    event.preventDefault();
    if (busy) return;
    const form = Object.fromEntries([...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value)]));
    const problems = check(form);
    if (problems) {
      setErrors(problems);
      focusFirstProblem(event.currentTarget, problems);
      return;
    }
    setBusy(true);
    setErrors({});
    const result = await send(form);
    setBusy(false);
    if (!result.ok) {
      const next = { ...result.errors, ...(result.error ? { form: result.error } : {}) };
      setErrors(next);
      focusFirstProblem(event.currentTarget, next);
    }
  }

  return { errors, busy, submit };
}

function focusFirstProblem(form: HTMLFormElement, errors: FieldErrors) {
  const field = Object.keys(errors).find((name) => name !== "form");
  if (field) form.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { errors, busy, submit } = useSubmit();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) =>
        submit(
          event,
          (form) => {
            const parsed = LoginSchema.safeParse(form);
            return parsed.success ? null : fieldErrors(parsed.error);
          },
          (form) => account.login(form.login, form.password),
        )
      }
    >
      <Field label="Username or email" error={errors.login}>
        {(props) => <input {...props} name="login" autoComplete="username" autoCapitalize="none" spellCheck={false} className="input" />}
      </Field>
      <PasswordField label="Password" name="password" autoComplete="current-password" error={errors.password} />
      <FormError message={errors.form} />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-small text-soft">
        New here?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
          Create a free account
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ city, onSwitch }: { city: CityId | null; onSwitch: () => void }) {
  const { errors, busy, submit } = useSubmit();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) =>
        submit(
          event,
          (form) => {
            const parsed = RegisterSchema.safeParse(form);
            return parsed.success ? null : fieldErrors(parsed.error);
          },
          (form) => account.register(form),
        )
      }
    >
      <Field label="Full name" error={errors.name}>
        {(props) => <input {...props} name="name" autoComplete="name" className="input" />}
      </Field>
      <Field label="Username" hint="You can log in with this or your email. English letters, numbers, _ or ." error={errors.username}>
        {(props) => <input {...props} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} className="input" />}
      </Field>
      <Field label="City" error={errors.city}>
        {(props) => (
          <select {...props} name="city" defaultValue={city ?? ""} autoComplete="address-level2" className="input">
            <option value="" disabled>
              Choose your city
            </option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Email" error={errors.email}>
        {(props) => <input {...props} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} className="input" />}
      </Field>
      <Field label="Mobile number" hint="For example 0300 1234567" error={errors.phone}>
        {(props) => <input {...props} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" className="input" />}
      </Field>
      <PasswordField label="Password" name="password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} error={errors.password} />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" error={errors.confirmPassword} />
      <FormError message={errors.form} />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Creating your account…" : "Create account"}
      </button>
      <p className="text-center text-small text-soft">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
          Log in
        </button>
      </p>
    </form>
  );
}

type InputProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

/** A label, the control, an optional hint and the problem (read out by screen readers with the field). */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (props: InputProps) => ReactNode }) {
  const id = useId();
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-small font-semibold text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": described })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-caption text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-small font-medium text-urgent">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ label, name, autoComplete, hint, error }: { label: string; name: string; autoComplete: string; hint?: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      {(props) => (
        <div className="relative">
          <input {...props} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} maxLength={72} className="input pr-12" />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-button text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name={visible ? "eye-off" : "eye"} className="size-5" />
          </button>
        </div>
      )}
    </Field>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-button bg-urgent/10 px-3 py-2.5 text-small font-medium text-urgent">
      {message}
    </p>
  );
}
