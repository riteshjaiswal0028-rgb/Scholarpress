import { looksLikeSection, KEYWORDS_INLINE_RE } from "./journal";
import { normalizeArticleHtml, CAPTION_RE } from "./article-normalize";

/**
 * PDF text to organised reading HTML for the public article page.
 * Works from the positioned text items a PDF reader reports (text, x, y, font size), so it needs no DOM and no model:
 * lines are rebuilt from the items, running headers, footers and page numbers are dropped, hyphenated line ends are repaired,
 * and the lines are grouped into headings, paragraphs and lists by their size and spacing.
 * Output is escaped text in the same small tag set the Word converter uses (h3 to h6, p, ul, ol), styled by the same `.fulltext` rules.
 * Tables and figures in a PDF have no reliable text order, so they may read oddly here; the page keeps the original pages one tab away.
 */

export interface PdfTextItem { str: string; x: number; y: number; w: number; size: number }
export interface PdfPageText { width: number; height: number; items: PdfTextItem[] }
export interface PdfStructured { html: string; words: number; headings: number }

interface Cell { text: string; x: number; x1: number }
interface Line { cells: Cell[]; text: string; x: number; x1: number; y: number; size: number; page: number; top: boolean; bottom: boolean }
type Block = { kind: "h"; level: number; text: string } | { kind: "p"; text: string; ref?: boolean; page?: number } | { kind: "table"; rows: string[][] } | { kind: "li"; ordered: boolean; text: string } | { kind: "kw"; text: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]!; };
export const MAX_PDF_HTML_CHARS = 2_500_000;

const BULLET_RE = /^[•▪◦●■‣·⁃∙*-]\s+(?=\S)/;
const ORDERED_RE = /^(?:\(?\d{1,2}[.)]|\(?[a-z][.)])\s+(?=\S)/;
const NUMBERED_HEADING_RE = /^(\d{1,2}(?:\.\d{1,2}){0,2})\.?\s+(?=[A-Z])/;
const REF_START_RE = /^(?:\[\d{1,3}\]|\d{1,3}\.)\s+\S/;
const PAGE_NUMBER_RE = /^(?:page\s+)?\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?$/i;
const TERMINAL_RE = /[.!?:;)\]"”]$/;

/** Rebuild reading lines from a page's positioned items: same baseline means same line; a gap means a space. */
function pageLines(p: PdfPageText, page: number): Line[] {
  const items = p.items.filter((i) => i.str.length > 0 && Number.isFinite(i.x) && Number.isFinite(i.y));
  items.sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PdfTextItem[][] = [];
  for (const it of items) {
    const row = rows[rows.length - 1];
    const ref = row?.[0];
    if (row && ref && Math.abs(ref.y - it.y) <= Math.max(2, Math.min(ref.size, it.size || ref.size) * 0.45)) row.push(it);
    else rows.push([it]);
  }
  const out: Line[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let text = ""; let end = row[0]!.x; let size = 0; let chars = 0;
    const cells: Cell[] = [];
    for (const it of row) {
      const gap = it.x - end;
      const last = cells[cells.length - 1];
      if (!last || gap > Math.max(it.size * 1.6, 9)) cells.push({ text: it.str.trim(), x: it.x, x1: it.x + it.w });
      else { last.text += (gap > it.size * 0.18 && !last.text.endsWith(" ") && !it.str.startsWith(" ") ? " " : "") + it.str.trim(); last.x1 = it.x + it.w; }
      if (text && gap > it.size * 0.18 && !text.endsWith(" ") && !it.str.startsWith(" ")) text += " ";
      text += it.str; end = it.x + it.w; size += it.size * it.str.length; chars += it.str.length;
    }
    const t = text.replace(/[\u0000-\u0008\u000B-\u001F­]/g, "").replace(/\s+/g, " ").trim();
    if (!t) continue;
    const y = row[0]!.y;
    out.push({ cells: cells.filter((c) => c.text), text: t, x: row[0]!.x, x1: end, y, size: chars ? size / chars : 0, page, top: y > p.height * 0.92, bottom: y < p.height * 0.08 });
  }
  return out;
}

/** Lines that repeat across pages in the top or bottom margin (journal name, author running head, page numbers). */
function dropRunning(pages: Line[][]): Line[][] {
  const seen = new Map<string, Set<number>>();
  for (const lines of pages) for (const l of lines) if (l.top || l.bottom) {
    const k = norm(l.text.replace(/\d+/g, "#"));
    if (k) { if (!seen.has(k)) seen.set(k, new Set()); seen.get(k)!.add(l.page); }
  }
  const need = Math.max(2, Math.ceil(pages.length * 0.4));
  return pages.map((lines) => lines.filter((l) => {
    if (!(l.top || l.bottom)) return true;
    if (PAGE_NUMBER_RE.test(l.text)) return false;
    return pages.length < 2 || (seen.get(norm(l.text.replace(/\d+/g, "#")))?.size ?? 0) < need;
  }));
}

const NUMERICISH = /^[−\-–+]?\(?\d[\d,.\s]*\)?%?(?:\s*[±(][\d.,\s)–\-]*)?(?:\s*[*†‡§]+)?$/;

/** Runs of three or more lines in a page that read as columns of short cells (not two-column prose): they are tables. */
function findTables(pages: Line[][], body: number, lh: number): { starts: Map<Line, Line[]>; inside: Set<Line> } {
  const starts = new Map<Line, Line[]>(); const inside = new Set<Line>();
  for (const lines of pages) {
    const tab = (l: Line) => l.cells.length >= 2 && l.cells.every((c) => c.text.length <= 40) && l.size < body * 1.18 && !BULLET_RE.test(l.text);
    let run: Line[] = [];
    const close = () => {
      if (run.length >= 3) {
        const counts = new Map<number, number>();
        for (const r of run) counts.set(r.cells.length, (counts.get(r.cells.length) ?? 0) + 1);
        const modal = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
        const cells = run.flatMap((r) => r.cells);
        const numeric = cells.filter((c) => NUMERICISH.test(c.text)).length / Math.max(1, cells.length);
        if (numeric >= 0.25 || modal >= 3) { starts.set(run[0]!, run); for (const r of run) inside.add(r); }
      }
      run = [];
    };
    for (const l of lines) {
      if (tab(l) && (!run.length || run[run.length - 1]!.y - l.y < lh * 2.4)) run.push(l);
      else { close(); if (tab(l)) run.push(l); }
    }
    close();
  }
  return { starts, inside };
}

function tableGrid(rows: Line[]): string[][] {
  const widest = rows.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
  const cols = widest.cells.map((c) => ({ x: c.x, x1: c.x1 }));
  const grid = rows.map((r) => {
    const row = cols.map(() => "");
    for (const c of r.cells) {
      let best = 0; let bestScore = -Infinity;
      cols.forEach((col, i) => {
        const overlap = Math.min(c.x1, col.x1) - Math.max(c.x, col.x);
        const score = overlap > 0 ? overlap : -Math.abs((c.x + c.x1) / 2 - (col.x + col.x1) / 2);
        if (score > bestScore) { bestScore = score; best = i; }
      });
      row[best] = row[best] ? `${row[best]} ${c.text}` : c.text;
    }
    return row;
  });
  const keep = cols.map((_c, i) => grid.some((r) => r[i]));
  return grid.map((r) => r.filter((_c, i) => keep[i]));
}

export function structurePdf(pagesIn: PdfPageText[], opts: { title?: string } = {}): PdfStructured {
  const pages = dropRunning(pagesIn.map((p, i) => pageLines(p, i + 1)));
  const all = pages.flat();
  if (all.length === 0) return { html: "", words: 0, headings: 0 };

  // Body size: the size most characters are set in.
  const weight = new Map<number, number>();
  for (const l of all) { const k = Math.round(l.size * 2) / 2; weight.set(k, (weight.get(k) ?? 0) + l.text.length); }
  const body = [...weight.entries()].sort((a, b) => b[1] - a[1])[0]![0] || 10;
  const bigSizes = [...new Set(all.filter((l) => l.size >= body * 1.18).map((l) => Math.round(l.size * 2) / 2))].sort((a, b) => b - a);
  const levelFor = (size: number) => { const r = bigSizes.indexOf(Math.round(size * 2) / 2); return Math.min(3 + Math.max(0, r), 5); };

  const gaps: number[] = [];
  for (const lines of pages) for (let i = 1; i < lines.length; i++) { const g = lines[i - 1]!.y - lines[i]!.y; if (g > 0 && g < body * 2.2) gaps.push(g); }
  const lh = median(gaps) || body * 1.25;
  const left = median(all.map((l) => l.x));
  const widest = Math.max(...all.map((l) => l.x1 - l.x));

  // Drop the title block at the very top of page one: the page already shows the title above the text.
  const titleKey = opts.title ? norm(opts.title) : "";
  const skipLines = new Set<Line>();
  if (titleKey) for (const l of (pages[0] ?? []).slice(0, 8)) if (l.size >= body * 1.18 && norm(l.text) && titleKey.includes(norm(l.text))) skipLines.add(l);

  const { starts: tableStarts, inside: tableInside } = findTables(pages, body, lh);
  const blocks: Block[] = [];
  let para: Line[] = [];
  let inRefs = false;
  const flush = () => {
    if (!para.length) return;
    const first = para[0]!;
    let text = "";
    for (const l of para) {
      if (!text) { text = l.text; continue; }
      if (/[A-Za-z]-$/.test(text) && /^[a-z]/.test(l.text)) text = text.slice(0, -1) + l.text;
      else text += " " + l.text;
    }
    text = text.replace(/\s+([,.;:!?])/g, "$1").trim();
    para = [];
    if (!text) return;
    const kw = KEYWORDS_INLINE_RE.exec(text);
    if (kw) { blocks.push({ kind: "kw", text: kw[1]!.replace(/\s*[\n|;]+\s*/g, ", ") }); return; }
    const bullet = BULLET_RE.exec(text);
    if (bullet) { blocks.push({ kind: "li", ordered: false, text: text.slice(bullet[0].length) }); return; }
    const ord = ORDERED_RE.exec(text);
    if (ord && !inRefs && text.length > 0) { blocks.push({ kind: "li", ordered: true, text: text.slice(ord[0].length) }); return; }
    blocks.push({ kind: "p", text, ref: inRefs, page: first.page });
  };

  let prev: Line | null = null;
  pages.forEach((lines) => {
    lines.forEach((l) => {
      if (skipLines.has(l)) return;
      const tbl = tableStarts.get(l);
      if (tbl) { flush(); blocks.push({ kind: "table", rows: tableGrid(tbl) }); prev = tbl[tbl.length - 1]!; return; }
      if (tableInside.has(l)) return;
      const bigger = l.size >= body * 1.18;
      const sectionish = looksLikeSection(l.text) && l.size >= body * 0.95;
      const numbered = NUMBERED_HEADING_RE.test(l.text) && l.text.length <= 80 && !/[.,;:]$/.test(l.text) && (!prev || prev.page !== l.page || prev.y - l.y > lh * 1.3 || TERMINAL_RE.test(prev.text));
      const heading = (bigger && l.text.length <= 160) || sectionish || numbered;
      if (heading) {
        // A heading set over several lines of the same size is one heading.
        const last = blocks[blocks.length - 1];
        if (!para.length && last?.kind === "h" && prev && prev.size === l.size && prev.page === l.page && prev.y - l.y < lh * 1.3 && bigger) { last.text += " " + l.text; prev = l; return; }
        flush();
        const depth = numbered && !bigger ? Math.min(4 + (NUMBERED_HEADING_RE.exec(l.text)![1]!.split(".").length - 1), 6) : bigger ? levelFor(l.size) : 4;
        inRefs = /^(references?|bibliography)\b/i.test(l.text);
        blocks.push({ kind: "h", level: depth, text: l.text.replace(/\s*[:.]$/, "") });
        prev = l; return;
      }
      const startsItem = BULLET_RE.test(l.text) || KEYWORDS_INLINE_RE.test(l.text) || (inRefs && REF_START_RE.test(l.text)) || (!inRefs && ORDERED_RE.test(l.text)) || (!inRefs && CAPTION_RE.test(l.text));
      const newPage = prev && prev.page !== l.page;
      const gap = prev && !newPage ? prev.y - l.y : 0;
      const indented = !!prev && l.x - left > body * 1.1 && TERMINAL_RE.test(prev.text);
      const shortPrev = !!prev && !newPage && prev.x1 - prev.x < widest * 0.62 && TERMINAL_RE.test(prev.text) && l.x - left < body * 3;
      if (para.length && (startsItem || gap > lh * 1.45 || indented || shortPrev)) flush();
      else if (!para.length && prev && newPage) { /* a paragraph may continue across the page break */ }
      para.push(l);
      prev = l;
    });
    // A page break does not end a paragraph unless the last line ends a sentence and is short.
    const lastLine = lines[lines.length - 1];
    if (lastLine && para.length && TERMINAL_RE.test(lastLine.text) && lastLine.x1 - lastLine.x < widest * 0.7) flush();
  });
  flush();

  let html = ""; let words = 0; let headings = 0;
  let list: "ul" | "ol" | null = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const b of blocks) {
    if (html.length > MAX_PDF_HTML_CHARS) break;
    if (b.kind === "li") {
      const tag = b.ordered ? "ol" : "ul";
      if (list !== tag) { close(); html += `<${tag}>`; list = tag; }
      html += `<li>${esc(b.text)}</li>`; words += b.text.split(/\s+/).length; continue;
    }
    close();
    if (b.kind === "table") {
      const rows = b.rows.filter((r) => r.some(Boolean));
      if (rows.length) { html += `<div class="ft-table"><table><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; words += rows.flat().join(" ").split(/\s+/).filter(Boolean).length; }
      continue;
    }
    if (b.kind === "h") { html += `<h${b.level}>${esc(b.text)}</h${b.level}>`; headings++; }
    else if (b.kind === "kw") html += `<p class="ft-kw"><strong>Keywords:</strong> ${esc(b.text)}</p>`;
    else {
      const cap = !b.ref && b.page ? CAPTION_RE.exec(b.text) : null;
      if (cap && !/^table/i.test(cap[1]!) && b.text.length <= 600) {
        html += `<figure class="ft-fig ft-fig-ref" data-page="${b.page}"><a class="ft-fig-ph" href="#original-pdf" data-goto-pdf="${b.page}">Figure on page ${b.page}: view it in the original PDF</a><figcaption><span class="ft-cap-label">Figure ${esc(cap[2]!)}</span> ${esc(cap[3]!.trim())}</figcaption></figure>`;
      } else html += `<p${b.ref ? ' class="ft-ref"' : ""}>${esc(b.text)}</p>`;
      words += b.text.split(/\s+/).length;
    }
  }
  close();
  return { html: normalizeArticleHtml(html), words, headings };
}

/** Positioned items from a pdf.js text-content result. Transform is [a, b, c, d, e, f]; e and f are the origin. */
export function toPdfItems(content: { items: Array<unknown> }): PdfTextItem[] {
  const out: PdfTextItem[] = [];
  for (const raw of content.items) {
    const it = raw as { str?: string; transform?: number[]; width?: number; height?: number };
    if (typeof it.str !== "string" || !it.transform) continue;
    const t = it.transform;
    const size = Math.hypot(t[2] ?? 0, t[3] ?? 0) || it.height || 0;
    out.push({ str: it.str, x: t[4] ?? 0, y: t[5] ?? 0, w: it.width ?? 0, size });
  }
  return out;
}
