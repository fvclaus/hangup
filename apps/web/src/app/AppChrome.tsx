"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* The home route renders its own full-bleed HangUp header, so the shared
 * (light) navbar and the default top margin are suppressed there. Every other
 * route keeps the standard chrome. The footer is always present (privacy /
 * cookie links). */
export default function AppChrome({
  navbar,
  footer,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const isHome = usePathname() === "/";

  return (
    <>
      {!isHome && navbar}
      <main className={isHome ? "" : "mt-10"}>{children}</main>
      {footer}
    </>
  );
}
