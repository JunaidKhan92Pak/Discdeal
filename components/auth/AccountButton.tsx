"use client";

import { DropdownMenu } from "radix-ui";
import { Hint } from "@/components/ui/Hint";
import { Icon } from "@/components/ui/Icon";
import { account, useAccount } from "@/hooks/useAccount";

/** In the header: a person icon ("Log in") when logged out; the person's initial with a small menu (log out) when logged in. */
export function AccountButton() {
  const { ready, accounts, user } = useAccount();
  // Nothing until the server answered (no flash of "Log in" for people who are logged in), or if accounts are off.
  if (!ready || !accounts) return null;

  // Both rest as one round icon, like every other tool in the header; the hint says what it is.
  if (!user) {
    return (
      <Hint label="Log in" detail="Save deals and find them on any device.">
        <button type="button" className="pill" data-iconic="" onClick={() => account.ask({ mode: "login" })} aria-label="Log in or create an account">
          <Icon name="user" className="size-5" />
        </button>
      </Hint>
    );
  }

  return (
    <DropdownMenu.Root>
      <Hint label={user.name} detail="Your account">
        <DropdownMenu.Trigger className="pill" data-iconic="" aria-label={`Account: ${user.name}`}>
          <span className="grid size-5 place-items-center rounded-full bg-primary text-caption font-bold text-on-primary" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </DropdownMenu.Trigger>
      </Hint>
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
