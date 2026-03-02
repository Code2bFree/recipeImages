"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type PageLink = {
  href: string;
  label: string;
};

const PAGES: PageLink[] = [
  { href: "/", label: "Recipe generator" },
  { href: "/edit", label: "Image editor" },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = useMemo(() => {
    return PAGES.find((p) => p.href === pathname) ?? PAGES[0];
  }, [pathname]);

  return (
    <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors " +
            (open ? "bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-500")
          }
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <HamburgerIcon />
          Pages
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {PAGES.map((p) => {
              const active = p.href === pathname;
              return (
                <Link
                  key={p.href}
                  role="menuitem"
                  href={p.href}
                  onClick={() => setOpen(false)}
                  className={
                    "block px-3 py-2 text-sm transition-colors " +
                    (active
                      ? "bg-zinc-50 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900")
                  }
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="text-[0.935rem] font-semibold text-zinc-900 dark:text-zinc-50">
        {current.label}
      </div>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
