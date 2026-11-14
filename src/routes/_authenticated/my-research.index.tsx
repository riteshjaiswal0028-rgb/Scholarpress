import { EmptyState } from "@/components/empty-state";
import { createFileRoute, Link } from "@tanstack/react-router";
import { myPapersQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { STATUS_LABEL } from "@/lib/domain/constants";
import { Button } from "@/components/ui/button";
import { PageTitle, StatusBadge, fmtDate } from "@/lib/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { displayTitle } from "@/lib/title-case";

export const Route = createFileRoute("/_authenticated/my-research/")({
  head: () => ({ meta: [{ title: "My research | Scholarly" }, { name: "description", content: "Scholarly research records, submissions and verification." }, { property: "og:title", content: "My research | Scholarly" }, { property: "og:description", content: "Scholarly research records, submissions and verification." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => { void context.queryClient.prefetchQuery(myPapersQuery()); },
  component: MyResearch,
});

const NEXT_ACTION: Record<string, string> = {
  PAYMENT_PENDING: "Pay the fee to start screening",
  REVISION_REQUIRED: "Read the editor's comments",
  PUBLISHED: "View record",
  CORRECTED: "View record",
};

function MyResearch() {
  const { data, isLoading, error } = useQuery(myPapersQuery());
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");
  const keyOf = (p: { awaitingPayment: boolean; status: string }) => (p.awaitingPayment ? "PAYMENT_PENDING" : p.status);
  const present = useMemo(() => Array.from(new Set((data ?? []).map(keyOf))), [data]);
  const shown = useMemo(() => {
    const t = text.trim().toLowerCase();
    const rows = (data ?? []).filter((p) => (!status || keyOf(p) === status) && (!t || p.title.toLowerCase().includes(t) || p.public_id.toLowerCase().includes(t)));
    return [...rows].sort((x, y) => sort === "title" ? x.title.localeCompare(y.title) : sort === "oldest" ? +new Date(x.created_at) - +new Date(y.created_at) : +new Date(y.created_at) - +new Date(x.created_at));
  }, [data, text, status, sort]);
  const chip = (active: boolean) => `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[14px] font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`;
  return (
    <div className="mx-auto max-w-5xl px-5 pt-8 sm:pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="My Research" subtitle="Track your submissions and published work." />
        <Button asChild className="rounded-full"><Link to="/submit"><Plus />New Submission</Link></Button>
      </div>
      {isLoading && (
        <div role="status" aria-label="Loading your submissions" className="divide-y divide-border border-y border-border">
          {[0, 1, 2].map((i) => <div key={i} className="space-y-2 py-4"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-1/4" /></div>)}
        </div>
      )}
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">Your submissions could not be loaded. Refresh the page to try again.</p>}
      {data && data.length === 0 && (
        <EmptyState icon={FileText} title="You have not submitted anything yet" action={<Button asChild><Link to="/submit">Submit research</Link></Button>}>Upload a PDF with your author details and declarations. Screening starts once the submission fee is paid.</EmptyState>
      )}
      {data && data.length > 0 && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="mr-search" className="sr-only">Search your submissions</label>
              <input id="mr-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search your submissions…" className="h-12 w-full rounded-full border border-input bg-card pl-11 pr-4 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <label htmlFor="mr-sort" className="sr-only">Sort</label>
            <select id="mr-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-12 rounded-full border border-input bg-card px-4 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48">
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A to Z</option>
            </select>
          </div>
          {present.length > 0 && (
            <ul aria-label="Filter by status" className="article-tabs-chips mt-3 flex gap-2 overflow-x-auto py-1">
              <li className="shrink-0"><button type="button" aria-pressed={status === ""} onClick={() => setStatus("")} className={chip(status === "")}>All ({data.length})</button></li>
              {present.map((k) => <li key={k} className="shrink-0"><button type="button" aria-pressed={status === k} onClick={() => setStatus(status === k ? "" : k)} className={chip(status === k)}>{STATUS_LABEL[k] ?? k}</button></li>)}
            </ul>
          )}
          <p className="mt-4 font-mono text-[12.5px] uppercase tracking-wide text-muted-foreground" aria-live="polite">{shown.length} of {data.length}</p>
          {shown.length === 0 && <p className="py-8 text-muted-foreground">No submissions match. Clear the search or choose another status.</p>}
          <ul className="stagger mt-2 space-y-3 md:hidden" aria-label="Your submissions">
            {shown.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"><FileText className="size-5" strokeWidth={1.5} /></span>
                  <Link to="/my-research/$id" params={{ id: p.id }} className="min-w-0 flex-1 font-serif text-[1.05rem] font-semibold leading-snug text-foreground">{displayTitle(p.title)}</Link>
                  <span className="shrink-0"><StatusBadge status={keyOf(p)} /></span>
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground"><span className="tabular-nums">{p.public_id}</span> · {p.article_type} · Submitted {fmtDate(p.created_at)}</p>
                <Link to="/my-research/$id" params={{ id: p.id }} className="mt-3 inline-flex min-h-11 items-center gap-1 text-[14.5px] font-medium text-primary no-underline hover:underline">{NEXT_ACTION[keyOf(p)] ?? "Track progress"} <span aria-hidden="true">→</span></Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 hidden max-w-full md:block">
            <table className="pm-table w-full table-fixed text-left text-[15px]">
              <caption className="sr-only">Your submissions</caption>
              <thead><tr className="border-b border-gold/60 font-sans text-[11.5px] uppercase tracking-[0.16em] text-gold-ink"><th scope="col" className="w-[42%] py-2.5 pr-4 font-semibold">Title</th><th scope="col" className="py-2.5 pr-4 font-semibold">Type</th><th scope="col" className="py-2.5 pr-4 font-semibold">Submitted</th><th scope="col" className="py-2.5 pr-4 font-semibold">Status</th><th scope="col" className="py-2.5 font-semibold">Next</th></tr></thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id} className="border-b border-border align-top transition-colors duration-200 hover:bg-wash">
                    <td className="py-3 pr-4"><Link to="/my-research/$id" params={{ id: p.id }} className="title-link font-serif text-[1.2rem] font-semibold text-primary">{displayTitle(p.title)}</Link><div className="text-sm tabular-nums text-muted-foreground">{p.public_id}</div></td>
                    <td className="py-3 pr-4">{p.article_type}</td>
                    <td className="py-3 pr-4">{fmtDate(p.created_at)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={keyOf(p)} /></td>
                    <td className="py-3"><Link to="/my-research/$id" params={{ id: p.id }} className="text-[14.5px] font-medium text-primary no-underline hover:underline">{NEXT_ACTION[keyOf(p)] ?? "Track progress"}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
