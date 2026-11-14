import { formatTitle } from "../title-case";

/**
 * ONE universal Scholarly article format.
 *
 * Both converters (Word in docx-html.ts, PDF in pdf-structure.ts) hand their HTML to normalizeArticleHtml(), so every
 * submission reads the same way whatever the author's own styling was:
 *  - headings: bold-only lines, numbered lines ("2.1 Methods") and SHOUTING lines become real headings, the levels are
 *    renumbered to one contiguous scale (h3 sections, h4 subsections, h5 and h6 below), ALL CAPS becomes title case;
 *  - paragraphs: author alignment and indents are dropped; the stylesheet sets every body paragraph justified with
 *    hyphenation (left-aligned on narrow phones); stray spaces, tabs and empty paragraphs are removed;
 *  - captions: "Figure 1." / "Table 2:" captions are detected and joined to their figure or table in a <figure>, tables
 *    caption-above, figures caption-below; images without a caption still get the same frame;
 *  - tables: a header row is found when the author did not mark one, numeric cells are marked for right alignment;
 *  - references: paragraphs and lists under a References heading get the hanging-indent style;
 *  - structured abstracts: "Background:", "Methods:" and similar lead-ins are set bold;
 *  - typography: curly quotes and apostrophes, en and em dashes, ellipses, no-break space after "Figure" / "Table".
 * Input and output use the same small tag set (h3-h6, p, ul, ol, figure, div.ft-table, img, inline marks), so the output is as safe as the input.
 * The function is idempotent: running it on its own output changes nothing.
 */

export const CAPTION_RE = /^(Figure|Fig\.?|Table|Chart|Graph|Scheme|Plate|Diagram|Box)\s*([A-Z]?\d+[A-Za-z]?|[IVX]{1,5})\s*(?:[.:)\]\-–—|]\s*|\s+(?=[A-Z(]))(.*)$/s;
const CAPTION_STRIP_RE = /^(?:<[^>]+>)*(?:Figure|Fig\.?|Table|Chart|Graph|Scheme|Plate|Diagram|Box)\s*(?:[A-Z]?\d+[A-Za-z]?|[IVX]{1,5})(?:<\/[^>]+>)*\s*(?:[.:)\]\-–—|]\s*)?(?:<\/[^>]+>)*\s*/;
const LEAD_RE = /^(Background|Objectives?|Aims?|Purpose|Design|Setting|Participants|Interventions?|Methods?|Materials and methods|Findings|Results|Conclusions?|Significance|Importance|Implications|Limitations|Originality|Practical implications|Context|Context and objective|Main outcome measures?)\s*[:.–—]\s*(?=\S)/;
const REF_HEAD_RE = /^(references?|bibliography|works cited|literature cited|cited literature|sources)$/i;
const NUM_RE = /^[−\-–+]?\(?\d[\d,.\s]*\)?%?(?:\s*[±(][\d.,\s)–\-]*)?(?:\s*[*†‡§]+)?$/;

const ENT_PLAIN: Array<[RegExp, string]> = [[/&lt;/g, "<"], [/&gt;/g, ">"], [/&quot;/g, '"'], [/&amp;/g, "&"]];
/** Visible text of a fragment of this tag set. */
export function plainText(h: string): string {
  let s = h.replace(/<!--[\s\S]*?-->/g, "").replace(/<br\s*\/?>/g, " ").replace(/&emsp;|&nbsp;/g, " ").replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, "");
  for (const [re, to] of ENT_PLAIN) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").trim();
}

/** Splits a fragment into its top-level elements. Depth-aware, so lists and tables stay in one piece. */
export function splitBlocks(html: string): string[] {
  const out: string[] = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  const VOID = new Set(["img", "br", "hr"]);
  let depth = 0; let start = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    const closing = m[1] === "/"; const name = (m[2] ?? "").toLowerCase(); const self = m[3] === "/" || VOID.has(name);
    if (closing) { depth = Math.max(0, depth - 1); if (depth === 0) { out.push(html.slice(start, re.lastIndex)); start = re.lastIndex; } }
    else if (self) { if (depth === 0) { out.push(html.slice(start, re.lastIndex)); start = re.lastIndex; } }
    else depth++;
  }
  const rest = html.slice(start).trim();
  if (rest) out.push(rest);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Drops closing tags with no opener and closes tags left open, for the inline marks only. */
function balance(h: string): string {
  const stack: string[] = [];
  const out = h.replace(/<(\/?)(strong|em|u|s|sup|sub|a|span)\b[^>]*>/g, (tag, c: string, name: string) => {
    if (!c) { stack.push(name); return tag; }
    const i = stack.lastIndexOf(name);
    if (i < 0) return "";
    stack.splice(i);
    return tag;
  });
  return out + stack.reverse().map((n) => `</${n}>`).join("");
}

/** If a paragraph is one short bold line, it is a heading: returns its text and a relative level (4 = top, deeper numbers = deeper). */
export function boldHeading(innerHtml: string): { level: number; text: string } | null {
  if (innerHtml.includes("<img")) return null;
  const text = plainText(innerHtml);
  if (!text || text.length > 110 || text.split(" ").length > 16) return null;
  if (plainText(innerHtml.replace(/<strong>[\s\S]*?<\/strong>/g, ""))) return null;
  if (CAPTION_RE.test(text)) return null;
  const numbered = /^(\d{1,2}(?:\.\d{1,2}){0,3})\.?\s+\S/.exec(text);
  if (/[.!?;,]$/.test(text) && !numbered && text.split(" ").length > 3) return null;
  if (/[.,;]$/.test(text) && text.split(" ").length > 8) return null;
  if (numbered) return { level: 3 + numbered[1]!.split(".").length, text };
  if (/^[IVX]{1,5}\.\s+[A-Z]/.test(text)) return { level: 4, text };
  if (/^[A-Z]\.\s+[A-Z]/.test(text)) return { level: 5, text };
  return { level: innerHtml.includes("<em>") ? 5 : 4, text };
}

function typo(html: string): string {
  let last = "";
  return html.replace(/(<[^>]+>)([^<]+)/g, (_m, tag: string, seg: string) => {
    if (/^<(p|h[1-6]|li|td|th|figcaption|figure|div|ul|ol)\b/i.test(tag) || /^<br/i.test(tag)) last = "";
    let s = seg.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:!?%)\]])/g, "$1").replace(/\.{3}/g, "…").replace(/\s--\s/g, " — ").replace(/(\S)\s+-\s+(?=\S)/g, "$1 – ");
    s = s.replace(/&quot;/g, () => "\u0001");
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      const prev = i > 0 ? s[i - 1]! : last;
      if (ch === "\u0001") out += !prev || /[\s([{—–/“‘]/.test(prev) ? "“" : "”";
      else if (ch === "'") out += !prev || /[\s([{—–/“]/.test(prev) ? "‘" : "’";
      else out += ch;
    }
    out = out.replace(/\b(Figures?|Fig\.|Tables?|Eq\.|Eqs\.|Section|Sec\.|No\.) (?=\d)/g, "$1&nbsp;");
    last = out.slice(-1);
    return tag + out;
  });
}

const stripMarks = (h: string, ...names: string[]) => names.reduce((acc, n) => acc.replace(new RegExp(`</?${n}>`, "g"), ""), h);

function normTable(div: string): string {
  const rows = div.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  let out = div;
  if (rows.length >= 2 && !/<th\b/.test(rows[0]!) && /<td\b/.test(rows[0]!)) {
    const first = [...rows[0]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]!);
    const texts = first.map(plainText);
    const allBold = first.length > 0 && first.every((c) => !plainText(c) || !plainText(c.replace(/<strong>[\s\S]*?<\/strong>/g, "")));
    const laterNumeric = rows.slice(1).some((r) => [...r.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].some((m) => NUM_RE.test(plainText(m[1]!))));
    const shortText = texts.every((t) => t.length <= 48 && !NUM_RE.test(t));
    if (allBold || (shortText && laterNumeric && rows.length >= 3)) {
      const head = rows[0]!.replace(/<td\b([^>]*)>/g, '<th scope="col"$1>').replace(/<\/td>/g, "</th>");
      out = out.replace(rows[0]!, head);
    }
  }
  out = out.replace(/<td((?:\s[^>]*)?)>([\s\S]*?)<\/td>/g, (m, a: string, inner: string) => (NUM_RE.test(plainText(inner)) && !/class=/.test(a) ? `<td class="num"${a}>${inner}</td>` : m));
  return out;
}

type Item =
  | { k: "h"; level: number; inner: string }
  | { k: "p"; html: string; cls: string }
  | { k: "img"; html: string }
  | { k: "table"; html: string; chart?: boolean }
  | { k: "cap"; kind: string; label: string; inner: string }
  | { k: "raw"; html: string }
  | { k: "fig"; html: string };

export function normalizeArticleHtml(input: string): string {
  const items: Item[] = [];
  for (const blk of splitBlocks(input)) {
    const tag = /^<([a-z0-9]+)/i.exec(blk)?.[1]?.toLowerCase() ?? "";
    const heading = /^h([3-6])$/.exec(tag);
    if (heading) {
      const inner = blk.replace(/^<h[3-6][^>]*>/, "").replace(/<\/h[3-6]>$/, "");
      if (plainText(inner)) items.push({ k: "h", level: Number(heading[1]), inner });
      continue;
    }
    if (tag === "p") {
      const open = /^<p([^>]*)>/.exec(blk)?.[1] ?? "";
      const cls = /class="([^"]*)"/.exec(open)?.[1] ?? "";
      let inner = blk.replace(/^<p[^>]*>/, "").replace(/<\/p>$/, "").replace(/^(?:&emsp;|\s)+/, "").replace(/(?:<br>|\s)+$/, "");
      const text = plainText(inner);
      if (!text && !inner.includes("<img")) continue;
      if (!text && inner.includes("<img")) { items.push({ k: "img", html: inner.match(/<img[^>]*>/g)!.join("") }); continue; }
      if (/\bft-(kw|title|ref|caption)\b/.test(cls)) { items.push({ k: "p", html: inner, cls }); continue; }
      const cap = CAPTION_RE.exec(text);
      if (cap && text.length <= 600) {
        const kind = /^table/i.test(cap[1]!) ? "table" : "figure";
        const label = `${/^fig/i.test(cap[1]!) ? "Figure" : cap[1]![0]!.toUpperCase() + cap[1]!.slice(1).toLowerCase().replace(/\.$/, "")} ${cap[2]}`;
        items.push({ k: "cap", kind, label, inner: balance(inner.replace(CAPTION_STRIP_RE, "")) });
        continue;
      }
      const bh = boldHeading(inner);
      if (bh) { items.push({ k: "h", level: bh.level, inner: stripMarks(inner, "strong") }); continue; }
      const keepCenter = /ft-center/.test(cls) && text.length <= 140;
      if (!/^<strong\b/.test(inner) && LEAD_RE.test(text) && text.length > 60) inner = inner.replace(/^((?:<[^>]+>)*)([A-Za-z ]{3,40}?)(\s*[:.–—])(?=\s)/, (m, pre: string, label: string, punct: string) => (LEAD_RE.test(label + punct + " x") ? `${pre}<strong class="ft-lead">${label}${punct}</strong>` : m));
      items.push({ k: "p", html: inner, cls: keepCenter ? "ft-center" : "" });
      continue;
    }
    if (tag === "div" && /ft-table/.test(blk.slice(0, 40))) { items.push({ k: "table", html: normTable(blk), chart: /ft-chart/.test(blk.slice(0, 60)) }); continue; }
    if (tag === "img") { items.push({ k: "img", html: blk }); continue; }
    items.push({ k: "raw", html: blk });
  }

  // Heading levels: one contiguous scale starting at h3.
  const levels = [...new Set(items.filter((i): i is Extract<Item, { k: "h" }> => i.k === "h").map((i) => i.level))].sort((a, b) => a - b);
  const remap = new Map(levels.map((l, i) => [l, Math.min(3 + i, 6)]));

  // Captions join their figure or table; the caption may come before or after it.
  const out: Array<Item & { used?: boolean }> = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    if (it.k === "cap") {
      const next = items[i + 1]; const prev = out[out.length - 1];
      const capHtml = `<figcaption><span class="ft-cap-label">${it.label}</span> ${it.inner}</figcaption>`;
      const wrapT = (t: { html: string; chart?: boolean }, top: boolean) => `<figure class="ft-fig ${t.chart ? "ft-fig-chart" : "ft-fig-table"}">${top ? capHtml + t.html : t.html + capHtml}</figure>`;
      if (it.kind === "table") {
        if (next?.k === "table" && !next.chart) { out.push({ k: "fig", html: wrapT(next, true) }); i++; continue; }
        if (prev?.k === "table" && !prev.chart) { out[out.length - 1] = { k: "fig", html: wrapT(prev, true) }; continue; }
      } else {
        if (prev?.k === "img") { out[out.length - 1] = { k: "fig", html: `<figure class="ft-fig ft-fig-image">${prev.html}${capHtml}</figure>` }; continue; }
        if (prev?.k === "table" && prev.chart) { out[out.length - 1] = { k: "fig", html: wrapT(prev, false) }; continue; }
        if (next?.k === "img") {
          let imgs = ""; let j = i + 1;
          while (items[j]?.k === "img") { imgs += (items[j] as { html: string }).html; j++; }
          out.push({ k: "fig", html: `<figure class="ft-fig ft-fig-image">${imgs}${capHtml}</figure>` }); i = j - 1; continue;
        }
        if (next?.k === "table" && next.chart) { out.push({ k: "fig", html: wrapT(next, false) }); i++; continue; }
      }
      out.push({ k: "p", html: `<span class="ft-cap-label">${it.label}</span> ${it.inner}`, cls: "ft-caption" });
      continue;
    }
    out.push(it);
  }

  let html = ""; let inRefs = false;
  for (const it of out) {
    switch (it.k) {
      case "h": {
        let inner = stripMarks(it.inner, "strong").replace(/\s*[:.]\s*$/, "").trim();
        const t = plainText(inner);
        if (!/<[^>]+>/.test(inner) && t.length >= 4 && t === t.toUpperCase() && /[A-Z]{3}/.test(t)) inner = formatTitle(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
        inRefs = REF_HEAD_RE.test(plainText(inner));
        const lvl = remap.get(it.level) ?? it.level;
        html += `<h${lvl}>${inner}</h${lvl}>`; break;
      }
      case "p": {
        const cls = [it.cls, inRefs && !/ft-ref|ft-kw|ft-caption/.test(it.cls) ? "ft-ref" : ""].filter(Boolean).join(" ");
        html += `<p${cls ? ` class="${cls}"` : ""}>${it.html}</p>`; break;
      }
      case "img": html += `<figure class="ft-fig ft-fig-image">${it.html}</figure>`; break;
      case "table": html += `<figure class="ft-fig ${it.chart ? "ft-fig-chart" : "ft-fig-table"}">${it.html}</figure>`; break;
      case "fig": html += it.html; break;
      case "raw": html += inRefs ? it.html.replace(/^<(ul|ol)(?![^>]*ft-reflist)/, '<$1 class="ft-reflist"') : it.html; break;
      default: break;
    }
  }
  return typo(html);
}
