import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { myDashboard } from "@/lib/scholarly.functions";
import { PageTitle, StatusBadge, fmtDate } from "@/lib/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABEL } from "@/lib/domain/constants";
import { displayTitle } from "@/lib/title-case";
import { CountUp } from "@/components/count-up";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Scholarly" }, { name: "description", content: "Scholarly research records, submissions and verification." }, { property: "og:title", content: "Dashboard | Scholarly" }, { property: "og:description", content: "Scholarly research records, submissions and verification." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type To = "/admin" | "/reviews" | "/certificates" | "/my-research";
const Stat = ({ label, value, to }: { label: string; value: React.ReactNode; to: To }) => (
  <Link to={to} className="pm-stat group block no-underline">
    <span className={`block font-serif text-[2.6rem] font-semibold leading-none tabular-nums ${value === 0 ? "text-muted-foreground" : "text-primary"}`}>{typeof value === "number" ? <CountUp value={value} /> : value}</span>
    <span className="mt-3 block text-[11.5px] font-semibold uppercase leading-snug tracking-[0.14em] text-muted-foreground">{label}</span>
    <span aria-hidden="true" className="pm-stat-go">→</span>
  </Link>
);
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-5 mt-14 flex items-center gap-4 text-[1.75rem]">{children}<span aria-hidden="true" className="pm-gold-rule h-px flex-1" /></h2>;

function Dashboard() {
  const { data: d, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["dashboard"], queryFn: () => myDashboard(), staleTime: 0, refetchOnMount: "always" });
  if (isLoading) return (
    <div role="status" aria-label="Loading dashboard" className="mx-auto max-w-5xl px-5 pt-10">
      <Skeleton className="h-9 w-48" /><Skeleton className="mt-3 h-5 w-72" />
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[6.5rem] rounded-2xl" />)}</div>
      <div className="mt-6 divide-y divide-border border-y border-border">{[0, 1, 2].map((i) => <div key={i} className="flex items-center justify-between gap-4 py-3.5"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-6 w-24 rounded-full" /></div>)}</div>
    </div>
  );
  if (isError || !d) return (
    <div className="mx-auto max-w-5xl px-5 pt-10">
      <PageTitle eyebrow="Overview" title="Dashboard" />
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">
        <p>The dashboard could not be loaded.</p>
        <Button type="button" variant="outline" size="sm" loading={isFetching} onClick={() => void refetch()}>Try again</Button>
      </div>
    </div>
  );
  return (
    <div className="mx-auto max-w-5xl px-5 pb-6 pt-10">
      <PageTitle eyebrow="Overview" title="Dashboard" subtitle="What needs your attention, by role." />

      <H>As an author</H>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Stat label="In progress" value={d.author.submissions.length} to="/my-research" />
        <Stat label="Revisions requested" value={d.author.revisionsRequested.length} to="/my-research" />
        <Stat label="Awaiting payment" value={d.author.awaitingPayment.length} to="/my-research" />
        <Stat label="Certificates" value={d.author.certificates} to="/certificates" />
      </div>
      {d.author.submissions.length === 0 && d.author.published.length === 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[15px] text-muted-foreground">You have no submissions yet.</p>
          <Button asChild size="sm"><Link to="/submit">Submit research</Link></Button>
        </div>
      )}
      {d.author.submissions.length > 0 && (
        <ul className="mt-4 divide-y divide-border border-y border-border text-[15px]">
          {d.author.submissions.slice(0, 8).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <Link to="/my-research/$id" params={{ id: p.id }} className="link">{p.title ? displayTitle(p.title) : "Untitled"}</Link>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      )}
      {d.author.published.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold">Published</h3>
          <ul className="mt-2 divide-y divide-border border-y border-border text-[15px]">
            {d.author.published.map((p) => (
              <li key={p.scholarpress_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link to="/article/$scholarpressId" params={{ scholarpressId: p.scholarpress_id }} className="link">{displayTitle(p.title)}</Link>
                <span className="text-sm text-muted-foreground">{p.doi ? `DOI ${p.doi}` : "No DOI registered"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {d.reviewer && (
        <>
          <H>As a reviewer</H>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Stat label="Invitations" value={d.reviewer.invitations} to="/reviews" />
            <Stat label="Active reviews" value={d.reviewer.active} to="/reviews" />
            <Stat label="Completed" value={d.reviewer.completed} to="/reviews" />
            <Stat label="Overdue" value={d.reviewer.overdue} to="/reviews" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Next deadline: {d.reviewer.nextDue ? fmtDate(d.reviewer.nextDue) : "none set"}.</p>
        </>
      )}

      {d.editor && (
        <>
          <H>As an editor</H>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {Object.entries(d.editor).map(([s, n]) => (
              <Stat key={s} label={(STATUS_LABEL as Record<string, string>)[s] ?? s} value={n} to="/admin" />
            ))}
          </div>
        </>
      )}

      {d.admin && (
        <>
          <H>As an administrator</H>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Stat label="Registered users" value={d.admin.users} to="/admin" />
            <Stat label="Board entries awaiting confirmation" value={d.admin.boardUnconfirmed} to="/admin" />
            <Stat label="Payments in progress" value={d.admin.pendingPayments} to="/admin" />
            <Stat label="Audit events, last 24 h" value={d.admin.auditLast24h} to="/admin" />
          </div>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-[16rem_minmax(0,1fr)]">
            <dt className="text-muted-foreground">Journal mode</dt><dd>{d.admin.journalMode ? "On: journal articles can be set; every record still goes through peer review" : "Off: every record still goes through peer review"}</dd>
            <dt className="text-muted-foreground">Online payments</dt><dd>{d.admin.paymentsOpen ? "Open" : "Not configured"}</dd>
            <dt className="text-muted-foreground">DOI provider</dt><dd>{d.admin.doiProvider === "none" ? "None configured: no DOIs are registered" : d.admin.doiProvider}</dd>
            <dt className="text-muted-foreground">ISSN</dt><dd>{d.admin.issnConfirmed ? "Confirmed and public" : "None assigned"}</dd>
          </dl>
        </>
      )}
    </div>
  );
}
