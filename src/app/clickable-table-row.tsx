"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

export function ClickableTableRow({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function openFromClick(event: MouseEvent<HTMLTableRowElement>) {
    if ((event.target as Element).closest("a, button, .delete-action, .approval-control")) return;
    router.push(href);
  }

  function openFromKeyboard(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

  return (
    <tr
      className="clickable-row"
      tabIndex={0}
      aria-label={label}
      onClick={openFromClick}
      onKeyDown={openFromKeyboard}
    >
      {children}
    </tr>
  );
}
