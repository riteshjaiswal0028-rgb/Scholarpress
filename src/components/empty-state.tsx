import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** One friendly empty state for lists: a round icon, a short title, one line of help, and the next step. */
export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="animate-in fade-in-0 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center duration-500 sm:py-14">
      <span className="grid size-16 place-items-center rounded-full bg-secondary text-primary"><Icon aria-hidden="true" className="size-8" strokeWidth={1.4} /></span>
      <p className="mt-4 font-serif text-[1.35rem] font-semibold leading-tight sm:text-[1.6rem]">{title}</p>
      {children && <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">{children}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
