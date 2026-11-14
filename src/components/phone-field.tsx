import { ChevronDown } from "lucide-react";
import { countryByIso, sortedCountries } from "@/lib/domain/phone";
import { cn } from "@/lib/utils";

const { priority, others } = sortedCountries();

/**
 * Country selector plus national number. A native <select> is used on purpose: on a phone it opens the system picker (fast, accessible, searchable by typing).
 * The five countries most authors write from come first, then every other country A to Z. The dial code is shown beside the name.
 */
export function PhoneField({ id, country, onCountry, value, onValue, invalid, describedBy, autoFocus }: {
  id: string; country: string; onCountry: (iso: string) => void; value: string; onValue: (v: string) => void;
  invalid?: boolean | undefined; describedBy?: string | undefined; autoFocus?: boolean | undefined;
}) {
  const dial = countryByIso(country)?.dial ?? "";
  const field = "h-[46px] rounded-md border bg-card text-base transition-[border-color,box-shadow] duration-150 hover:border-foreground/40 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30";
  const border = invalid ? "border-destructive" : "border-input";
  return (
    <div className="flex min-w-0 gap-2">
      <div className="relative w-[9.25rem] shrink-0 sm:w-44">
        <select
          id={`${id}-country`} aria-label="Country" value={country} onChange={(e) => onCountry(e.target.value)}
          className={cn(field, border, "w-full appearance-none truncate pl-3 pr-8")}
        >
          <optgroup label="Common">
            {priority.map((c) => <option key={c.iso} value={c.iso}>{c.name} (+{c.dial})</option>)}
          </optgroup>
          <optgroup label="All countries">
            {others.map((c) => <option key={c.iso} value={c.iso}>{c.name} (+{c.dial})</option>)}
          </optgroup>
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="relative min-w-0 flex-1">
        <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted-foreground tabular-nums">+{dial}</span>
        <input
          id={id} type="tel" inputMode="tel" autoComplete="tel-national" autoFocus={autoFocus} maxLength={24}
          aria-invalid={invalid || undefined} aria-describedby={describedBy}
          value={value} onChange={(e) => onValue(e.target.value.replace(/[^\d\s\-().+]/g, ""))}
          style={{ paddingLeft: `${1.1 + dial.length * 0.62}rem` }}
          className={cn(field, border, "w-full min-w-0 pr-3 tabular-nums")}
        />
      </div>
    </div>
  );
}
