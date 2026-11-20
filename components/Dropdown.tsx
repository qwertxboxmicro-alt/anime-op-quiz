"use client";
// Styled replacement for <select>: the native popup can't be themed on Windows (white list, grey highlight).
import { useEffect, useRef, useState } from "react";
import { IChev } from "@/components/Icons";

type Opt<T> = { value: T; label: string };

export function Dropdown<T extends string | number>({ id, value, options, onChange, icon, warm = false }: { id: string; value: T; options: Opt<T>[]; onChange: (v: T) => void; icon: React.ReactNode; warm?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const cur = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    setActive(cur);
    setOpen(true);
  };
  const pick = (i: number) => {
    setOpen(false);
    box.current?.querySelector("button")?.focus();
    if (options[i].value !== value) onChange(options[i].value);
  };

  return (
    <div className={`sel ${warm ? "warm" : ""} ${open ? "open" : ""}`} ref={box}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
      >
        {icon}
        <span>{options[cur]?.label}</span>
        <IChev />
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(active); }
            else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); box.current?.querySelector("button")?.focus(); }
          }}
        >
          {options.map((o, i) => (
            <li
              key={String(o.value)}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === cur}
              className={i === active ? "hi" : ""}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
