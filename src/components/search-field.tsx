import { useEffect, useRef } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The journal's main search box. Press "/" anywhere on the page to jump into it. */
export function SearchField({ id, defaultValue, onSearch, large = false, className = "" }: { id: string; defaultValue?: string | undefined; onSearch: (q: string) => void; large?: boolean; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(String(new FormData(e.currentTarget).get("q") ?? "").trim()); }}
      className={`search-field group flex items-center gap-2 rounded-full border border-input bg-card shadow-soft ${large ? "p-1.5 pl-5 sm:p-2 sm:pl-6" : "p-1.5 pl-5"} ${className}`}>
      <Search aria-hidden="true" className={`shrink-0 text-muted-foreground ${large ? "size-5" : "size-[18px]"}`} />
      <label htmlFor={id} className="sr-only">Search published research</label>
      <input ref={ref} id={id} name="q" defaultValue={defaultValue} autoComplete="off" placeholder="Search articles, authors, or keywords…"
        className={`min-w-0 flex-1 border-0 bg-transparent font-sans placeholder:text-muted-foreground/70 focus:outline-none ${large ? "h-12 text-base sm:text-[1.0625rem]" : "h-10 text-base"}`} />
      <kbd aria-hidden="true" className="hidden h-6 min-w-6 items-center justify-center rounded-full border border-border bg-wash px-1.5 font-sans text-xs text-muted-foreground transition-opacity duration-200 group-focus-within:opacity-0 sm:inline-flex">/</kbd>
      <Button type="submit" size={large ? "lg" : "default"} aria-label="Search" className={`max-sm:size-11 max-sm:rounded-full max-sm:px-0 ${large ? "max-sm:bg-transparent max-sm:text-foreground max-sm:shadow-none max-sm:hover:bg-wash" : ""}`}><span className="max-sm:hidden">Search</span>{large ? <SlidersHorizontal aria-hidden="true" className="sm:hidden" /> : <Search aria-hidden="true" className="sm:hidden" />}</Button>
    </form>
  );
}
