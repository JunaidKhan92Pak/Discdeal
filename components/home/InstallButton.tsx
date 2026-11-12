"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Icon, type IconName } from "@/components/ui/Icon";
import { promptInstall, useInstallState } from "@/lib/install";
import { SITE_NAME } from "@/lib/site";

/**
 * "Download the app", in the header of the start screen. Installs DiscDeal on the phone (or computer) like an app:
 * on its home screen, opening full screen, no app store. Where the browser can show its own install prompt (Chrome,
 * Android) one tap does it; on iPhone, and in browsers without a prompt, a short sheet shows the two or three taps.
 * Hidden when DiscDeal is already open as the installed app.
 */
export function InstallButton() {
  const state = useInstallState();
  const [helpOpen, setHelpOpen] = useState(false);

  if (state === "unknown" || state === "installed") return null;

  async function install() {
    if ((await promptInstall()) === "unavailable") setHelpOpen(true);
  }

  return (
    <>
      <button type="button" onClick={install} className="pill animate-fade bg-primary-soft text-primary hover:bg-primary hover:text-on-primary" aria-label={`Download the ${SITE_NAME} app`}>
        <Icon name="download" className="size-5" strokeWidth={2} />
        <span>
          <span className="sm:hidden">App</span>
          <span className="max-sm:hidden">Download the app</span>
        </span>
      </button>
      <InstallHelp open={helpOpen} onOpenChange={setHelpOpen} apple={state === "ios"} />
    </>
  );
}

function Step({ n, icon, children }: { n: number; icon: IconName; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-small font-bold text-primary">{n}</span>
      <span className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1 text-body text-ink">
        <span>{children}</span>
        <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-soft" />
      </span>
    </li>
  );
}

/** How to add DiscDeal by hand, for iPhone (Safari's Share menu) and for browsers without an install prompt. */
function InstallHelp({ open, onOpenChange, apple }: { open: boolean; onOpenChange: (open: boolean) => void; apple: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="sheet px-5 pb-6 sm:px-6">
          <div className="sheet-handle" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 pt-3 sm:pt-5">
            <div>
              <Dialog.Title className="text-title">Get {SITE_NAME} on your phone</Dialog.Title>
              <Dialog.Description className="mt-1 text-small text-soft">
                Free, no app store, and it takes almost no space. It opens from your home screen like any other app.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn -mt-2 -mr-2 shrink-0" aria-label="Close">
              <Icon name="close" className="size-6" />
            </Dialog.Close>
          </div>

          <ol className="mt-5 space-y-4">
            {apple ? (
              <>
                <Step n={1} icon="ios-share">
                  Tap <strong>Share</strong> in Safari&apos;s toolbar.
                </Step>
                <Step n={2} icon="plus-square">
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </Step>
                <Step n={3} icon="check">
                  Tap <strong>Add</strong>. {SITE_NAME} is now on your home screen.
                </Step>
              </>
            ) : (
              <>
                <Step n={1} icon="sort">
                  Open your browser&apos;s <strong>menu</strong> (⋮ or ⋯).
                </Step>
                <Step n={2} icon="download">
                  Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </Step>
                <Step n={3} icon="check">
                  Confirm. {SITE_NAME} is now with your apps.
                </Step>
              </>
            )}
          </ol>

          <Dialog.Close className="btn-primary mt-6 w-full">Got it</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
