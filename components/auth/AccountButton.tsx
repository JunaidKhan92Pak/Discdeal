"use client";

import { DropdownMenu } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import { account, useAccount } from "@/hooks/useAccount";

/** In the header: "Log in" when logged out; the person's first name with a small menu (log out) when logged in. */
export function AccountButton() {
  const { ready, accounts, user } = useAccount();
  // Nothing until the server answered (no flash of "Log in" for people who are logged in), or if accounts are off.
  if (!ready || !accounts) return null;

  if (!user) {
    return (
      <button type="button" className="pill" onClick={() => account.ask({ mode: "login" })} aria-label="Log in or create an account">
        <Icon name="user" className="size-5" />
        <span className="hidden sm:inline">Log in</span>
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="pill" aria-label={`Account: ${user.name}`}>
        <span className="grid size-6 place-items-center rounded-full bg-primary text-caption font-bold text-on-primary" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{user.name.split(" ")[0]}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="menu animate-pop min-w-56">
          <div className="mb-1 rounded-panel bg-fill px-4 py-3">
            <p className="truncate text-body font-semibold text-ink">{user.name}</p>
            <p className="truncate text-small text-muted">{user.email}</p>
          </div>
          <DropdownMenu.Item className="menu-item" onSelect={() => void account.logout()}>
            <Icon name="logout" className="size-5" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
