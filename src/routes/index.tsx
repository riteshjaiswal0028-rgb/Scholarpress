import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { explorePapers, getPublicStats } from "@/lib/app.functions";
import { ArrowRight, BookOpenCheck, FileText, Gem, Globe, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/search-field";

// Same key as the Explore page with no filters, so one request serves both.
const statsQuery = () => queryOptions({ queryKey: ["public-stats"], queryFn: () => getPublicStats(), staleTime: 5 * 60_000 });
const recent = () => queryOptions({ queryKey: ["explore", {}], queryFn: () => explorePapers({ data: {} }) });

export const Route = createFileRoute("/")({
  loader: ({ context }) => { void context.queryClient.prefetchQuery(recent()); void context.queryClient.prefetchQuery(statsQuery()); },
  head: () => ({
    meta: [
      { title: "Scholarly International Journal of Medical Innovation: open repository for screened research" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Scholarly International Journal of Medical Innovation publishes screened, peer-reviewed research with a transparent editorial record and verifiable author certificates." },
      { property: "og:title", content: "Scholarly International Journal of Medical Innovation: open repository for screened research" },
      { property: "og:description", content: "Screened, peer-reviewed medical research with a transparent editorial record and verifiable author certificates." },
    ],
  }),
  component: Home,
});

const PILLARS = [
  { title: "Trusted Publishing", lines: ["Trusted", "Publishing"], icon: BookOpenCheck },
  { title: "Rigorous Peer Review", lines: ["Rigorous", "Peer Review"], icon: ShieldCheck },
  { title: "Global Reach", lines: ["Global", "Reach"], icon: Globe },
  { title: "Academic Excellence", lines: ["Academic", "Excellence"], icon: Gem },
] as const;

/** 12,450 -> "12K+", 8,000 -> "8K", 640 -> "640". The "+" shows only when the figure was rounded down, so it is never an overstatement. */
function compact(v: number | undefined) {
  if (v === undefined) return "\u2014";
  if (v < 1000) return String(v);
  const k = Math.floor(v / 100) / 10 >= 10 ? Math.floor(v / 1000) : Math.floor(v / 100) / 10;
  const text = `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  const exact = k * 1000 === v;
  return exact ? text : `${text}+`;
}
const STEPS = [["Submit your", "manuscript"], ["Pass peer", "review"], ["Get", "published"]] as const;

/** Hero artwork: two journal volumes in front of soft arches. Drawn from theme tokens so it follows light and dark. Decorative. */
function Volume({ x, y, w, h, cover }: { x: number; y: number; w: number; h: number; cover: string }) {
  const lines = Array.from({ length: Math.floor((h - 14) / 5) }, (_, i) => y + 10 + i * 5);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" className={cover} />
      <rect x={x + 16} y={y + 6} width={w - 20} height={h - 12} rx="1.5" className="fill-[#f3eee2] dark:fill-[#cfd2c6]" />
      {lines.map((ly) => <line key={ly} x1={x + 18} x2={x + w - 6} y1={ly} y2={ly} className="stroke-black/10" strokeWidth="0.8" />)}
      <rect x={x + 4} y={y + 8} width="8" height="2" rx="1" className="fill-gold" />
      <rect x={x + 4} y={y + h - 10} width="8" height="2" rx="1" className="fill-gold" />
    </g>
  );
}
function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 240" aria-hidden="true" focusable="false" className={`hero-float ${className}`}>
      <path d="M130 240V112a100 100 0 0 1 200 0v128z" className="fill-accent" />
      <path d="M190 240V132a60 60 0 0 1 120 0v108z" className="fill-secondary-brand" opacity="0.55" />
      <ellipse cx="190" cy="222" rx="150" ry="9" className="fill-black/10" />
      <Volume x={50} y={176} w={260} h={44} cover="fill-primary" />
      <Volume x={78} y={130} w={214} h={46} cover="fill-secondary-brand" />
      <path d="M262 130q4-26 22-40 0 26-22 40z" className="fill-gold" opacity="0.9" />
    </svg>
  );
}

/** The books photo in light mode, the drawn artwork in dark mode. Decorative. */
function HeroVisual({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <img src="/hero-books.jpg" alt="" width={592} height={640} decoding="async" fetchPriority="high" className="hero-photo ml-auto h-auto w-full dark:hidden" />
      <HeroArt className="hidden h-full w-full dark:block" />
    </div>
  );
}

function Home() {
  const nav = Route.useNavigate();
  const { data: st } = useQuery(statsQuery());
  // Live counts from the repository itself. Nothing here is typed by hand.
  const n = compact;
  const stats = [
    { icon: FileText, value: n(st?.articles), label: "Articles published" },
    { icon: Users, value: n(st?.researchers), label: "Researchers" },
    { icon: Globe, value: n(st?.countries), label: "Countries" },
  ];
  return (
    <div>
      <section aria-labelledby="home-h" className="pm-hero">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-8 pt-6 sm:pb-12 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-12">
          <div className="stagger min-w-0 lg:max-w-[42rem]">
            <h1 id="home-h" className="pm-hero-title"><span>Share Knowledge.</span><span>Advance Research.</span></h1>
            <p className="pm-hero-lede">Screened, peer-reviewed research, with an open editorial record and certificates anyone can verify.</p>
            <div className="pt-6">
              <Button asChild size="lg" className="rounded-full px-6"><Link to="/submit">Submit your manuscript <ArrowRight /></Link></Button>
            </div>
          </div>
          <HeroVisual className="hidden w-full max-w-[22rem] justify-self-center lg:block" />
        </div>
        <HeroVisual className="pointer-events-none !absolute bottom-0 right-0 w-[38%] max-w-[16rem] lg:hidden" />
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-6">
        <SearchField id="home-search" large className="relative mt-4" onSearch={(q) => { void nav({ to: "/explore", search: q ? { q } : {} }); }} />

        <ul aria-label="What sets the journal apart" className="mt-6 flex items-start justify-between px-1">
          {PILLARS.map(({ title, lines, icon: Icon }) => (
            <li key={title} aria-label={title} className="flex flex-1 flex-col items-center gap-2.5 text-center [&:not(:first-child)]:relative [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-[3.4rem] [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-border [&:not(:first-child)]:before:content-['']">
              <Icon aria-hidden="true" className="size-[1.7rem] text-primary sm:size-8" strokeWidth={1.5} />
              <span aria-hidden="true" className="text-[13px] font-medium leading-[1.25] text-foreground sm:text-[15px]">{lines[0]}<br />{lines[1]}</span>
            </li>
          ))}
        </ul>

        <dl aria-label="The journal in figures" className="mt-5 grid grid-cols-3 rounded-2xl border border-border bg-secondary py-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="relative flex min-w-0 flex-col items-center gap-1.5 px-2 text-center [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:inset-y-1 [&:not(:first-child)]:before:left-0 [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-border [&:not(:first-child)]:before:content-['']">
              <Icon aria-hidden="true" className="size-[1.35rem] text-primary" strokeWidth={1.5} />
              <dd className="font-sans text-[1.6rem] font-semibold leading-none tracking-tight tabular-nums sm:text-3xl">{value}</dd>
              <dt className="text-[12px] leading-tight text-muted-foreground sm:text-sm">{label}</dt>
            </div>
          ))}
        </dl>

        <section aria-labelledby="proc-h" className="reveal mt-8 sm:mt-12">
          <h2 id="proc-h" className="pm-section-title text-[length:var(--text-section)] leading-tight">How publishing works</h2>
          <p className="mt-2 text-muted-foreground">Three clear steps, with every decision on the record.</p>
          <ol className="pm-steps3 mt-4">
            {STEPS.map((t, i) => (
              <li key={t.join(" ")}><span aria-hidden="true" className="pm-num3">{i + 1}</span><span className="sr-only">Step {i + 1}: </span><span>{t.map((l, k) => <span key={l} className="block">{l}</span>)}</span></li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
