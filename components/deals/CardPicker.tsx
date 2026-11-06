"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Icon } from "@/components/ui/Icon";
import type { MyCards } from "@/hooks/useMyCards";
import type { Bank, Card } from "@/lib/types";

type CardPickerProps = {
  myCards: MyCards;
  onSave: (next: MyCards) => void;
  /** Banks and cards from the data (null while loading). */
  banks: Bank[] | null;
  cards: Card[] | null;
};

/**
 * "My cards": tick the bank cards you have, then see only the discounts they get. A Radix Dialog (a bottom sheet on
 * phones). Saved on this device only, and only the card's name: the user never types a card number.
 */
export function CardPicker({ myCards, onSave, banks, cards }: CardPickerProps) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(myCards.cards);

  const active = myCards.only && myCards.cards.length > 0;
  const label = active ? `My cards (${myCards.cards.length})` : "My cards";

  function toggle(id: string) {
    setPicked((list) => (list.includes(id) ? list.filter((c) => c !== id) : [...list, id]));
  }

  function finish(only: boolean) {
    onSave({ cards: picked, only: only && picked.length > 0 });
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setPicked(myCards.cards); // start from what is saved each time it opens
        setOpen(next);
      }}
    >
      <Dialog.Trigger className="pill" data-active={active}>
        <Icon name="card" className="size-5" />
        {label}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="sheet flex max-h-[85svh] flex-col">
          <div className="sheet-handle" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5">
            <div>
              <Dialog.Title className="text-title">My cards</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-small text-soft">
                Tick the cards you have to see the discounts they get. Saved on this device only. We never ask for card numbers.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn -mt-2 -mr-2 shrink-0" aria-label="Close my cards">
              <Icon name="close" className="size-6" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
            {!banks || !cards ? (
              <p className="px-3 py-6 text-center text-body text-soft">Loading cards…</p>
            ) : null}
            {(banks ?? []).map((bank) => (
              <fieldset key={bank.id} className="mb-3">
                <legend className="eyebrow px-3 pb-1">{bank.name}</legend>
                {(cards ?? []).filter((c) => c.bank === bank.id).map((card) => {
                  const checked = picked.includes(card.id);
                  return (
                    <button key={card.id} type="button" role="checkbox" aria-checked={checked} className="list-row" onClick={() => toggle(card.id)}>
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${checked ? "bg-primary text-on-primary" : "bg-hover"}`}
                        aria-hidden="true"
                      >
                        {checked && <Icon name="check" className="size-4" strokeWidth={3} />}
                      </span>
                      <span className="flex-1">{card.name}</span>
                    </button>
                  );
                })}
              </fieldset>
            ))}
            <p className="px-3 pb-2 text-small text-muted">More banks are being added. Missing yours? It is coming soon.</p>
          </div>

          <div className="flex flex-col gap-2 px-5 pt-3 pb-5 sm:flex-row-reverse">
            <button type="button" className="btn-primary flex-1" disabled={picked.length === 0} onClick={() => finish(true)}>
              Show deals for my cards
            </button>
            <button type="button" className="btn-secondary" onClick={() => finish(false)}>
              Show all deals
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
