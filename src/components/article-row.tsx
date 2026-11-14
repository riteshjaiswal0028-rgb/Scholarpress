import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { displayTitle } from "@/lib/title-case";
import { Skeleton } from "@/components/ui/skeleton";

/** One published record in a list. The whole row is the link target; the title is the accessible link. The tile on the left is decorative. */
export function ArticleRow({ scholarpressId, title, abstract, children }: { scholarpressId: string; title: string; abstract: string; children: ReactNode }) {
  return (
    <li className="article-row group relative mb-3 flex min-w-0 gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-within:border-primary/40 sm:p-4">
      <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center self-start rounded-lg bg-gradient-to-br from-accent to-secondary-brand/40 text-primary sm:size-24"><FlaskConical className="size-8" strokeWidth={1.3} /></span>
      <div className="min-w-0 flex-1">
        <Link to="/article/$scholarpressId" params={{ scholarpressId }} className="title-link inline-block max-w-full break-words font-serif text-[1.1rem] font-semibold leading-[1.25] text-foreground [text-wrap:pretty] after:absolute after:inset-0 after:content-[''] sm:text-[1.3rem]">{displayTitle(title)}</Link>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.6] text-muted-foreground">{abstract}</p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 break-words text-[12.5px] text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

/** Placeholder with the same shape as ArticleRow, shown while a list loads. */
export function ArticleRowSkeleton() {
  return (
    <li aria-hidden="true" className="mb-3 flex min-w-0 gap-4 rounded-xl border border-border bg-card p-3 sm:p-4">
      <Skeleton className="size-20 shrink-0 self-start rounded-lg sm:size-24" />
      <div className="min-w-0 flex-1 space-y-2.5 pt-1">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </li>
  );
}
