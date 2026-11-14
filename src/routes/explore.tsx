import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { RouteError } from "@/components/route-error";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { explorePapers } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, SearchX, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchField } from "@/components/search-field";
import { ArticleRow, ArticleRowSkeleton } from "@/components/article-row";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { myPapersQuery } from "@/lib/queries";
import { displayTitle } from "@/lib/title-case";
import { PageTitle, StatusBadge, fmtDate } from "@/lib/ui";
import { PUBLICATION_TYPE_LABEL, type PublicationType } from "@/lib/domain/scholarly";

type Search = { view?: "mine" | undefined; q?: string | undefined; type?: "REPOSITORY_RECORD" | "PREPRINT" | "JOURNAL_ARTICLE" | undefined; field?: string | undefined; year?: number | undefined; peerReviewed?: boolean | undefined; sort?: "newest" | "oldest" | undefined; page?: number | undefined };
const q = (s: Search) => queryOptions({ queryKey: ["explore", s], queryFn: () => explorePapers({ data: s }) });

export const Route = createFileRoute("/explore")({
  validateSearch: z.object({
    view: z.enum(["mine"]).optional(), q: z.string().optional(), type: z.enum(["REPOSITORY_RECORD", "PREPRINT", "JOURNAL_ARTICLE"]).optional(), field: z.string().optional(),
    year: z.coerce.number().int().optional(), peerReviewed: z.boolean().optional(), sort: z.enum(["newest", "oldest"]).optional(), page: z.coerce.number().int().min(1).optional(),
  }),
  loaderDeps: ({ search }) => search,
  // On the server the list is fetched before the page is sent (good for search engines). In the app it loads in the background so the page and its skeleton appear at once.
  loader: ({ context, deps }) => (typeof window === "undefined" ? context.queryClient.ensureQueryData(q(deps)) : void context.queryClient.prefetchQuery(q(deps))),
  head: () => ({ meta: [
    { title: "Published research | Scholarly" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Search research published through Scholarly." },
    { property: "og:title", content: "Published research | Scholarly" }, { property: "og:description", content: "Search titles, abstracts and keywords." },
  ] }),
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} compact />,
  component: Explore,
});

const TYPE_OPTIONS = [["", "All record types"], ["REPOSITORY_RECORD", "Repository records"], ["PREPRINT", "Preprints"], ["JOURNAL_ARTICLE", "Journal articles"]] as const;

function Explore() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const { user } = useAuth();
  const mine = search.view === "mine" && !!user;
  const list = useQuery({ ...q(search), placeholderData: keepPreviousData });
  const empty = { rows: [], total: 0, page: 1, pageSize: 20, fields: [] as string[] };
  const data = list.data ?? empty;
  const loadingList = list.isLoading;
  const set = (patch: Partial<Search>) => nav({ search: (prev: Search) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });
  const own = useQuery({ ...myPapersQuery(), enabled: mine });
  const ownRows = (own.data ?? []).filter((p) => !search.q?.trim() || p.title.toLowerCase().includes(search.q.trim().toLowerCase()) || p.public_id.toLowerCase().includes(search.q.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const sel = "h-12 w-full max-w-full rounded-md border border-input bg-card px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const busy = useRouterState({ select: (st) => st.status === "pending" });
  const filterFields = (idp: string) => (
    <>
        <label className="sr-only" htmlFor={`${idp}-f-type`}>Record type</label>
        <select id={`${idp}-f-type`} className={sel} value={search.type ?? ""} onChange={(e) => set({ type: (e.target.value || undefined) as Search["type"] })}>{TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <label className="sr-only" htmlFor={`${idp}-f-field`}>Subject</label>
        <select id={`${idp}-f-field`} className={sel} value={search.field ?? ""} onChange={(e) => set({ field: e.target.value || undefined })}><option value="">All subjects</option>{data.fields.map((f) => <option key={f} value={f}>{f}</option>)}</select>
        <label className="sr-only" htmlFor={`${idp}-f-year`}>Year</label>
        <Input id={`${idp}-f-year`} inputMode="numeric" placeholder="Year" className="h-12 w-full" defaultValue={search.year} onBlur={(e) => { const v = Number(e.target.value); set({ year: Number.isInteger(v) && v >= 1990 ? v : undefined }); }} />
        <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={!!search.peerReviewed} onChange={(e) => set({ peerReviewed: e.target.checked || undefined })} />Peer reviewed only</label>
        <label className="sr-only" htmlFor={`${idp}-f-sort`}>Sort</label>
        <select id={`${idp}-f-sort`} className={sel} value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as Search["sort"] })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
    </>
  );
  const activeFilters = [search.type, search.field, search.year, search.peerReviewed, search.sort && search.sort !== "newest" ? search.sort : undefined].filter((v) => v !== undefined && v !== false).length;
  return (
    <div className="mx-auto max-w-[var(--content-w)] px-5 pt-8 sm:pt-12">
      <div className="explore-search"><SearchField id="q" defaultValue={search.q} onSearch={(v) => set({ q: v || undefined })} /></div>
      <div className="pt-6 sm:pt-8"><PageTitle title="All Research" subtitle="Discover the latest research and publications." /></div>
      {user && (
        <div role="tablist" aria-label="Which records" className="-mt-4 mb-5 inline-flex rounded-full border border-border bg-card p-1">
          {([[undefined, "Published"], ["mine", "My submissions"]] as const).map(([v, label]) => (
            <button key={label} type="button" role="tab" aria-selected={search.view === v} onClick={() => nav({ search: (prev: Search) => ({ ...prev, view: v, page: 1 }) })}
              className={`min-h-10 rounded-full px-4 text-[14px] font-medium transition-colors ${search.view === v ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-wash"}`}>{label}</button>
          ))}
        </div>
      )}
      {mine ? (
        <section aria-label="My submissions" className="min-w-0 pb-4">
          {own.isLoading && <ol role="status" aria-label="Loading your submissions">{[0, 1, 2, 3].map((i) => <ArticleRowSkeleton key={i} />)}</ol>}
          {own.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">Your submissions could not be loaded. Refresh to try again.</p>}
          {own.data && ownRows.length === 0 && (
            <EmptyState icon={FileText} title={search.q ? "No submission matches" : "You have not submitted anything yet"} action={!search.q ? <Button asChild><Link to="/submit">Submit research</Link></Button> : undefined}>{search.q ? "Try different words." : "Your submitted articles and their status will show here."}</EmptyState>
          )}
          <ol className="stagger">
            {ownRows.map((p) => (
              <li key={p.id} className="article-row group relative mb-3 flex min-w-0 gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 sm:p-4">
                <div className="min-w-0 flex-1">
                  <Link to="/my-research/$id" params={{ id: p.id }} className="title-link inline-block max-w-full break-words font-serif text-[1.1rem] font-semibold leading-[1.25] text-foreground after:absolute after:inset-0 after:content-[''] sm:text-[1.3rem]">{displayTitle(p.title)}</Link>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted-foreground"><StatusBadge status={p.awaitingPayment ? "PAYMENT_PENDING" : p.status} /><span>Submitted {fmtDate(p.created_at)}</span></div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (<>
      <div className="mt-4 lg:hidden">
        {loadingList && <div aria-hidden="true" className="-mx-5 flex gap-2 overflow-hidden px-5 py-1">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full" />)}</div>}
        {data.fields.length > 0 && (
          <ul aria-label="Subjects" className="article-tabs-chips -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
            <li className="shrink-0"><button type="button" aria-pressed={!search.field} onClick={() => set({ field: undefined })} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-medium transition-colors ${!search.field ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>All</button></li>
            {data.fields.map((f) => (
              <li key={f} className="shrink-0"><button type="button" aria-pressed={search.field === f} onClick={() => set({ field: search.field === f ? undefined : f })} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-medium transition-colors ${search.field === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>{f}</button></li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <label className="flex min-w-0 items-center gap-2 text-[15px]"><span className="shrink-0 text-muted-foreground">Sort by:</span>
            <select aria-label="Sort" className="min-h-11 min-w-0 rounded-md bg-transparent pr-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as Search["sort"] })}><option value="newest">Latest</option><option value="oldest">Oldest</option></select>
          </label>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="shrink-0"><SlidersHorizontal />Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <SheetHeader><SheetTitle>Filter and sort</SheetTitle></SheetHeader>
            <div className="mt-4 flex flex-col gap-3" role="group" aria-label="Filters">{filterFields("m")}</div>
            <SheetClose asChild><Button type="button" className="mt-5 w-full">Show {data.total} {data.total === 1 ? "record" : "records"}</Button></SheetClose>
          </SheetContent>
        </Sheet>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="hidden flex-col gap-3 self-start lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:flex" role="group" aria-label="Filters">
        <p className="font-mono text-[12px] uppercase tracking-wide text-muted-foreground">Refine</p>
        {filterFields("d")}
      </div>
      <div className="min-w-0">
      {(() => {
        const chips: Array<{ k: string; label: string; clear: Partial<Search> }> = [];
        if (search.q) chips.push({ k: "q", label: `“${search.q}”`, clear: { q: undefined } });
        if (search.type) chips.push({ k: "type", label: TYPE_OPTIONS.find(([v]) => v === search.type)?.[1] ?? search.type, clear: { type: undefined } });
        if (search.field) chips.push({ k: "field", label: search.field, clear: { field: undefined } });
        if (search.year) chips.push({ k: "year", label: String(search.year), clear: { year: undefined } });
        if (search.peerReviewed) chips.push({ k: "pr", label: "Peer reviewed", clear: { peerReviewed: undefined } });
        if (chips.length === 0) return null;
        return (
          <ul aria-label="Active filters" className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {chips.map((c) => (
              <li key={c.k} className="shrink-0">
                <button type="button" onClick={() => set(c.clear)} aria-label={`Remove filter ${c.label}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card pl-3.5 pr-2.5 text-[13.5px] font-medium transition-colors hover:bg-wash">
                  {c.label}<X aria-hidden="true" className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            <li className="shrink-0"><button type="button" onClick={() => nav({ search: (prev: Search) => ({ view: prev.view }) })} className="link inline-flex min-h-10 items-center px-2 text-[13.5px] font-medium">Clear all</button></li>
          </ul>
        );
      })()}
      {loadingList ? <Skeleton aria-hidden="true" className="mb-3 h-4 w-40" /> : <p className="pb-3 text-[14px] text-muted-foreground" aria-live="polite">{data.total} {data.total === 1 ? "record" : "records"}{search.q ? ` for “${search.q}”` : ""}</p>}
      {list.isError && <p role="alert" className="rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">Records could not be loaded. <button type="button" className="link font-medium" onClick={() => void list.refetch()}>Try again</button></p>}
      {loadingList && <ol role="status" aria-label="Loading records">{[0, 1, 2, 3, 4].map((i) => <ArticleRowSkeleton key={i} />)}</ol>}
      {!loadingList && !list.isError && data.rows.length === 0 && (search.q || search.type || search.field || search.year || search.peerReviewed
        ? <EmptyState icon={SearchX} title="No records match" action={<Button type="button" onClick={() => nav({ search: (prev: Search) => ({ view: prev.view }) })}>Clear all filters</Button>}>Try fewer filters or different words.</EmptyState>
        : <EmptyState icon={BookOpen} title="Nothing published yet" action={<Button asChild><Link to="/submit">Submit research</Link></Button>}>Records appear here once they pass review and are published.</EmptyState>)}
      <ol aria-busy={busy || list.isFetching} className={`stagger transition-opacity duration-300 ${busy || (list.isFetching && !loadingList) ? "opacity-50" : "opacity-100"}`}>
        {data.rows.map((p) => (
          <ArticleRow key={p.public_id} scholarpressId={p.scholarpress_id} title={p.title} abstract={p.abstract}>
            <span>{fmtDate(p.published_at)}</span>{p.field && <span>{p.field}</span>}<span>{PUBLICATION_TYPE_LABEL[p.publication_type as PublicationType]}</span>{p.peer_reviewed && <span className="font-medium text-foreground">Peer reviewed</span>}{p.status !== "PUBLISHED" && <StatusBadge status={p.status} />}
          </ArticleRow>
        ))}
      </ol>
      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-between border-t border-border pt-4 text-sm" aria-label="Pagination">
          <Button variant="outline" disabled={data.page <= 1} onClick={() => set({ page: data.page - 1 })}>Previous</Button>
          <span>Page {data.page} of {pages}</span>
          <Button variant="outline" disabled={data.page >= pages} onClick={() => set({ page: data.page + 1 })}>Next</Button>
        </nav>
      )}
      </div>
      </div>
      </>)}
    </div>
  );
}
