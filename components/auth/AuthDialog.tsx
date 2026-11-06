"use client";

import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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
        {/* dvh: with the keyboard open the sheet shrinks to the space above it (see `interactiveWidget` in app/layout.tsx). */}
        <Dialog.Content className="sheet flex max-h-[92dvh] flex-col">
          <div className="sheet-handle" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5">
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
            <Tabs.List aria-label="Log in or create an account" className="mx-5 grid grid-cols-2 gap-1 rounded-full bg-fill p-1">
              {(["login", "register"] as const).map((value) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="h-10 rounded-full text-body font-semibold text-soft transition-colors focus-visible:outline-2 focus-visible:outline-primary data-[state=active]:bg-raised data-[state=active]:text-ink"
                >
                  {value === "login" ? "Log in" : "Create account"}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4">
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

/** Puts the cursor in the first field with a problem, in the order they appear on screen (top to bottom). */
function focusFirstProblem(form: HTMLFormElement, errors: FieldErrors) {
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]")];
  fields.find((field) => errors[field.name])?.focus();
}

/**
 * Phone keyboards show "Next" on each field, and Enter in a form normally sends it: pressing Next after the name would
 * submit a half-filled form and cover it in errors. So Enter moves to the next field; only on the last one it sends.
 */
function nextFieldOnEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return;
  const fields = [...event.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")];
  const index = fields.indexOf(event.target);
  if (index < 0 || index === fields.length - 1) return;
  event.preventDefault();
  fields[index + 1].focus();
}

/**
 * The send button (and any problem from the server), pinned to the bottom of the sheet: always in thumb reach, even
 * halfway down a long form, and right above the keyboard when it is open.
 */
function FormFooter({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 space-y-3 bg-glass-strong px-5 pt-3 pb-5 backdrop-blur-xl">
      <FormError message={error} />
      {children}
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { errors, busy, submit } = useSubmit();
  return (
    <form
      noValidate
      className="space-y-4"
      onKeyDown={nextFieldOnEnter}
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
      <Field label="Email" error={errors.login}>
        {(props) => (
          <input {...props} name="login" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" className="input" />
        )}
      </Field>
      <PasswordField label="Password" name="password" autoComplete="current-password" enterKeyHint="go" error={errors.password} />
      <FormFooter error={errors.form}>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-small text-soft">
          New here?{" "}
          <button type="button" onClick={onSwitch} className="link">
            Create a free account
          </button>
        </p>
      </FormFooter>
    </form>
  );
}

function RegisterForm({ city, onSwitch }: { city: CityId | null; onSwitch: () => void }) {
  const { errors, busy, submit } = useSubmit();
  return (
    <form
      noValidate
      className="space-y-4"
      onKeyDown={nextFieldOnEnter}
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
      {/* The typed fields come one after another (the keyboard stays open), then the city picker, then passwords. */}
      <Field label="Full name" error={errors.name}>
        {(props) => <input {...props} name="name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="input" />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(props) => (
          <input {...props} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" className="input" />
        )}
      </Field>
      <Field label="Mobile number" hint="For example 0300 1234567" error={errors.phone}>
        {(props) => <input {...props} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" enterKeyHint="next" className="input" />}
      </Field>
      <Field label="City" error={errors.city}>
        {(props) => (
          <div className="relative">
            <select {...props} name="city" defaultValue={city ?? ""} autoComplete="address-level2" className="input pr-12">
              <option value="" disabled>
                Choose your city
              </option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {/* The arrow says "tap to choose" (the browser's own arrow is hidden to keep the pill shape). */}
            <Icon name="chevron-down" className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted" />
          </div>
        )}
      </Field>
      <PasswordField label="Password" name="password" autoComplete="new-password" enterKeyHint="next" hint={`At least ${PASSWORD_MIN} characters.`} error={errors.password} />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" enterKeyHint="go" error={errors.confirmPassword} />
      <FormFooter error={errors.form}>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating your account…" : "Create account"}
        </button>
        <p className="text-center text-small text-soft">
          Already have an account?{" "}
          <button type="button" onClick={onSwitch} className="link">
            Log in
          </button>
        </p>
      </FormFooter>
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

type PasswordFieldProps = { label: string; name: string; autoComplete: string; enterKeyHint: "next" | "go"; hint?: string; error?: string };

function PasswordField({ label, name, autoComplete, enterKeyHint, hint, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      {(props) => (
        <div className="relative">
          <input
            {...props}
            name={name}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={enterKeyHint}
            maxLength={72}
            className="input pr-12"
          />
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
    <p role="alert" className="rounded-panel bg-urgent-soft px-4 py-3 text-small font-medium text-urgent">
      {message}
    </p>
  );
}
